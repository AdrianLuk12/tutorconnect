from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.db.models import Q

class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email.lower())
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractUser):
    email = models.EmailField('email address', unique=True)
    first_name = models.CharField('first name', max_length=150, blank=True)
    last_name = models.CharField('last name', max_length=150, blank=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    objects = CustomUserManager()

    def save(self, *args, **kwargs):
        self.email = self.email.lower()
        super().save(*args, **kwargs)

class Profile(models.Model):
    STUDENT = 'student'
    TUTOR = 'tutor'
    BOTH = 'both'
    
    ROLE_CHOICES = [
        (STUDENT, 'Student'),
        (TUTOR, 'Tutor'),
        (BOTH, 'Both'),
    ]

    user = models.OneToOneField(get_user_model(), on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=STUDENT)
    school = models.CharField(max_length=200, blank=True)
    profile_picture = models.ImageField(upload_to='profile_pictures/', blank=True, null=True)
    subjects_need_help = models.JSONField(default=list, blank=True)
    subjects_can_teach = models.JSONField(default=list, blank=True)
    bio = models.TextField(max_length=500, blank=True)
    is_onboarded = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.email}'s profile"

@receiver(post_save, sender=get_user_model())
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

@receiver(post_save, sender=get_user_model())
def save_user_profile(sender, instance, **kwargs):
    instance.profile.save()

class Match(models.Model):
    PENDING = 'pending'
    ACCEPTED = 'accepted'
    REJECTED = 'rejected'
    
    STATUS_CHOICES = [
        (PENDING, 'Pending'),
        (ACCEPTED, 'Accepted'),
        (REJECTED, 'Rejected'),
    ]

    user_a = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='matches_as_a')
    user_b = models.ForeignKey(get_user_model(), on_delete=models.CASCADE, related_name='matches_as_b')
    status_a = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    status_b = models.CharField(max_length=10, choices=STATUS_CHOICES, default=PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user_a', 'user_b')

    @classmethod
    def create_or_update(cls, user_a, user_b, status):
        # Try to find existing match in either direction
        match = cls.objects.filter(
            (Q(user_a=user_a) & Q(user_b=user_b)) |
            (Q(user_a=user_b) & Q(user_b=user_a))
        ).first()
        
        if match:
            # Update existing match
            if match.user_a == user_a:
                match.status_a = status
            else:
                match.status_b = status
            match.save()
        else:
            # Create new match
            match = cls.objects.create(
                user_a=user_a,
                user_b=user_b,
                status_a=status,
                status_b=cls.PENDING
            )
        return match

    @property
    def is_mutual_match(self):
        return self.status_a == self.ACCEPTED and self.status_b == self.ACCEPTED