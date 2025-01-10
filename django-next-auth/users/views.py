from rest_framework.views import APIView
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
import json
from django.db.models import Q
from django.contrib.auth import get_user_model
from .models import Match, Profile, ChatMessage

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

        # # For testing/demo purposes, return mock data
        # mock_matches = [
        #     {
        #         'user': {
        #             'username': 'math_wizard',
        #             'profile_picture': None
        #         },
        #         'school': 'Stanford University',
        #         'subjects_need_help': ['Physics', 'Chemistry'],
        #         'subjects_can_teach': ['Calculus', 'Linear Algebra'],
        #         'bio': 'Math enthusiast looking to help others while improving my science knowledge.',
        #         'can_help_with': ['Calculus'],
        #         'can_get_help_with': ['Physics']
        #     },
        #     {
        #         'user': {
        #             'username': 'science_guru', 
        #             'profile_picture': None
        #         },
        #         'school': 'MIT',
        #         'subjects_need_help': ['Literature', 'History'],
        #         'subjects_can_teach': ['Physics', 'Chemistry'],
        #         'bio': 'PhD student passionate about making science accessible to everyone.',
        #         'can_help_with': ['Physics'],
        #         'can_get_help_with': ['Literature']
        #     },
        #     {
        #         'user': {
        #             'username': 'history_buff',
        #             'profile_picture': None
        #         },
        #         'school': 'Harvard University', 
        #         'subjects_need_help': ['Computer Science', 'Mathematics'],
        #         'subjects_can_teach': ['History', 'Literature'],
        #         'bio': 'History major looking to expand into STEM fields.',
        #         'can_help_with': ['Literature'],
        #         'can_get_help_with': ['Mathematics']
        #     }
        # ]

        # # return Response(mock_matches)




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
                        'id': potential_match.user.id,
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

class MatchActionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        try:
            target_user = get_user_model().objects.get(id=user_id)
            action = request.data.get('action')
            
            if action not in ['accept', 'reject']:
                return Response(
                    {'error': 'Invalid action'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            match_status = Match.ACCEPTED if action == 'accept' else Match.REJECTED
            match = Match.create_or_update(request.user, target_user, match_status)
            
            return Response({'status': 'success'})
            
        except get_user_model().DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class MatchesListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get all matches where the user is either user_a or user_b
        matches = Match.objects.filter(
            (Q(user_a=user) & Q(status_a=Match.ACCEPTED) & Q(status_b=Match.ACCEPTED)) |
            (Q(user_b=user) & Q(status_a=Match.ACCEPTED) & Q(status_b=Match.ACCEPTED))
        )
        
        matched_users = []
        for match in matches:
            # Get the other user in the match
            other_user = match.user_b if match.user_a == user else match.user_a
            other_profile = other_user.profile
            
            matched_users.append({
                'user': {
                    'id': other_user.id,
                    'username': other_user.username,
                    'profile_picture': request.build_absolute_uri(other_profile.profile_picture.url) if other_profile.profile_picture else None,
                },
                'school': other_profile.school,
                'subjects_need_help': other_profile.subjects_need_help,
                'subjects_can_teach': other_profile.subjects_can_teach,
                'bio': other_profile.bio,
            })
        
        return Response(matched_users)

class MatchRequestsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        
        # Get all pending matches where this user is user_b and user_a has accepted
        pending_matches = Match.objects.filter(
            user_b=user,
            status_a=Match.ACCEPTED,
            status_b=Match.PENDING
        )
        
        match_requests = []
        for match in pending_matches:
            other_user = match.user_a
            other_profile = other_user.profile
            
            # Calculate subject overlaps
            can_help_with = set(other_profile.subjects_can_teach) & set(user.profile.subjects_need_help)
            can_get_help_with = set(other_profile.subjects_need_help) & set(user.profile.subjects_can_teach)
            
            match_requests.append({
                'user': {
                    'id': other_user.id,
                    'username': other_user.username,
                    'profile_picture': request.build_absolute_uri(other_profile.profile_picture.url) if other_profile.profile_picture else None,
                },
                'school': other_profile.school,
                'subjects_need_help': other_profile.subjects_need_help,
                'subjects_can_teach': other_profile.subjects_can_teach,
                'bio': other_profile.bio,
                'can_help_with': list(can_help_with),
                'can_get_help_with': list(can_get_help_with)
            })
        
        return Response(match_requests)

class ChatHistoryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, user_id):
        try:
            other_user = get_user_model().objects.get(id=user_id)
            
            # Get messages between the two users
            messages = ChatMessage.objects.filter(
                (Q(sender=request.user, receiver=other_user) |
                Q(sender=other_user, receiver=request.user))
            ).order_by('timestamp')
            
            # Mark unread messages as read
            messages.filter(receiver=request.user, is_read=False).update(is_read=True)
            
            messages_data = [{
                'id': msg.id,
                'content': msg.content,
                'sender_id': msg.sender.id,
                'receiver_id': msg.receiver.id,
                'timestamp': msg.timestamp,
                'is_read': msg.is_read
            } for msg in messages]
            
            return Response(messages_data)
            
        except get_user_model().DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )

class MessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, user_id):
        try:
            receiver = get_user_model().objects.get(id=user_id)
            content = request.data.get('message')
            
            if not content:
                return Response(
                    {'error': 'Message content is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Create new message
            message = ChatMessage.objects.create(
                sender=request.user,
                receiver=receiver,
                content=content
            )

            return Response({
                'id': message.id,
                'content': message.content,
                'sender_id': message.sender.id,
                'receiver_id': message.receiver.id,
                'timestamp': message.timestamp,
                'is_read': message.is_read
            })

        except get_user_model().DoesNotExist:
            return Response(
                {'error': 'User not found'},
                status=status.HTTP_404_NOT_FOUND
            )