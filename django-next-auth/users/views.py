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