"""
URL configuration for ApiRoot project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from auth.views import LogoutView
from users.views import OnboardingView, ProfileView, PotentialMatchesView, MatchActionView, MatchesListView

urlpatterns = [
    path("auth/", include("djoser.urls")),
    path("auth/", include("djoser.urls.jwt")),
    path("auth/logout", LogoutView.as_view()),
    path('profile/onboarding/', OnboardingView.as_view(), name='complete-onboarding'),
    path('profile/', ProfileView.as_view(), name='profile'),
    path('potential-matches/', PotentialMatchesView.as_view(), name='potential-matches'),
    path('matches/', MatchesListView.as_view(), name='matches-list'),
    path('matches/<int:user_id>/', MatchActionView.as_view(), name='match-action'),
]
