from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import json

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