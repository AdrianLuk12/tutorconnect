from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import json
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Match, Profile

class OnboardingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            profile = request.user.profile
            
            # Get data from form-data
            profile.role = request.data.get('role', 'student')
            profile.school = request.data.get('school', '')
            profile.bio = request.data.get('bio', '')

            # Handle JSON strings for subjects
            subjects_need_help = request.data.get('subjects_need_help', '[]')
            subjects_can_teach = request.data.get('subjects_can_teach', '[]')
            
            # Parse JSON strings to Python lists
            profile.subjects_need_help = json.loads(subjects_need_help)
            profile.subjects_can_teach = json.loads(subjects_can_teach)

            # Handle profile picture
            if 'profile_picture' in request.FILES:
                profile.profile_picture = request.FILES['profile_picture']
            
            profile.is_onboarded = True
            profile.save()
            
            return Response({
                'status': 'success',
                'data': {
                    'role': profile.role,
                    'school': profile.school,
                    'subjects_need_help': profile.subjects_need_help,
                    'subjects_can_teach': profile.subjects_can_teach,
                    'bio': profile.bio,
                    'is_onboarded': profile.is_onboarded
                }
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = request.user.profile
        return Response({
            'username': request.user.username,
            'role': profile.role,
            'school': profile.school,
            'profile_picture': request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
            'subjects_need_help': profile.subjects_need_help,
            'subjects_can_teach': profile.subjects_can_teach,
            'bio': profile.bio,
        })

    def put(self, request):
        try:
            profile = request.user.profile
            user = request.user

            # Handle username update
            new_username = request.data.get('username')
            if new_username and new_username != user.username:
                # Check if username is already taken
                from django.contrib.auth import get_user_model
                User = get_user_model()
                if User.objects.filter(username=new_username).exists():
                    return Response({
                        'status': 'error',
                        'message': 'Username already taken'
                    }, status=status.HTTP_400_BAD_REQUEST)
                user.username = new_username
                user.save()
            
            # Handle existing profile fields
            profile.role = request.data.get('role', profile.role)
            profile.school = request.data.get('school', profile.school)
            profile.bio = request.data.get('bio', profile.bio)

            subjects_need_help = request.data.get('subjects_need_help')
            subjects_can_teach = request.data.get('subjects_can_teach')
            
            if subjects_need_help:
                profile.subjects_need_help = json.loads(subjects_need_help)
            if subjects_can_teach:
                profile.subjects_can_teach = json.loads(subjects_can_teach)

            if 'profile_picture' in request.FILES:
                profile.profile_picture = request.FILES['profile_picture']
            
            profile.save()
            
            return Response({
                'username': user.username,
                'role': profile.role,
                'school': profile.school,
                'profile_picture': request.build_absolute_uri(profile.profile_picture.url) if profile.profile_picture else None,
                'subjects_need_help': profile.subjects_need_help,
                'subjects_can_teach': profile.subjects_can_teach,
                'bio': profile.bio,
            })
            
        except Exception as e:
            return Response({
                'status': 'error',
                'message': str(e)
            }, status=status.HTTP_400_BAD_REQUEST)

class PotentialMatchesView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        profile = user.profile
        
        # Get all existing matches for this user
        existing_matches = Match.objects.filter(
            Q(user_a=user) | Q(user_b=user)
        ).values_list('user_a_id', 'user_b_id')
        
        # Flatten and combine matched user IDs
        matched_users = set()
        for match in existing_matches:
            matched_users.update(match)
        
        # Remove the current user from the set
        matched_users.discard(user.id)
        
        # Find potential matches based on subjects and school
        potential_matches = Profile.objects.exclude(
            user_id__in=matched_users
        ).exclude(
            user=user
        ).filter(
            school=profile.school,  # Same school
            is_onboarded=True      # Only onboarded users
        )

        # Filter based on subject matches
        matches = []
        for potential_match in potential_matches:
            # Check if there's any overlap between what user can teach and what potential match needs
            can_help_with = set(profile.subjects_can_teach) & set(potential_match.subjects_need_help)
            # Check if there's any overlap between what user needs and what potential match can teach
            can_get_help_with = set(profile.subjects_need_help) & set(potential_match.subjects_can_teach)
            
            # If there's at least one subject match in either direction
            if can_help_with or can_get_help_with:
                matches.append({
                    'user': {
                        'username': potential_match.user.username,
                        'profile_picture': request.build_absolute_uri(potential_match.profile_picture.url) if potential_match.profile_picture else None,
                    },
                    'school': potential_match.school,
                    'subjects_need_help': potential_match.subjects_need_help,
                    'subjects_can_teach': potential_match.subjects_can_teach,
                    'bio': potential_match.bio,
                    'can_help_with': list(can_help_with),
                    'can_get_help_with': list(can_get_help_with)
                })
        
        return Response(matches)