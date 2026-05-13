
from django.urls import path

from . import views

urlpatterns = [
    path("", views.index, name="index"),
    path("login", views.login_view, name="login"),
    path("logout", views.logout_view, name="logout"),
    path("register", views.register, name="register"),
    path("profile/<str:username>", views.profile, name="profile"),
    path("follow/<int:user_id>", views.follow_toggle, name="follow_toggle"),
    path("following", views.following, name="following"),
    path("like/<int:post_id>", views.like_toggle, name="like_toggle"),
]
