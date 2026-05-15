from django.contrib.auth import authenticate, login, logout
from django.db import IntegrityError
from django.http import HttpResponse, HttpResponseRedirect, JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.urls import reverse
from django.contrib.auth.decorators import login_required
from django.core.paginator import Paginator
from .utils import paginate_queryset, annotate_posts
from .models import Post, User, Follow, Like

def index(request):
    if request.method == "POST":
        content = request.POST["content"]

        post = Post(
            user=request.user,
            content=content
        )
        post.save()

        return redirect("index")
    
    posts = Post.objects.all().order_by("-timestamp")
    posts = annotate_posts(posts, request.user)

    page_obj = paginate_queryset(request, posts, 3)

    return render(request, "network/index.html", {
        "page_obj": page_obj
    })


def login_view(request):
    if request.method == "POST":

        # Attempt to sign user in
        username = request.POST["username"]
        password = request.POST["password"]
        user = authenticate(request, username=username, password=password)

        # Check if authentication successful
        if user is not None:
            login(request, user)
            return HttpResponseRedirect(reverse("index"))
        else:
            return render(request, "network/login.html", {
                "message": "Invalid username and/or password."
            })
    else:
        return render(request, "network/login.html")


def logout_view(request):
    logout(request)
    return HttpResponseRedirect(reverse("index"))


def register(request):
    if request.method == "POST":
        username = request.POST["username"]
        email = request.POST["email"]

        # Ensure password matches confirmation
        password = request.POST["password"]
        confirmation = request.POST["confirmation"]
        if password != confirmation:
            return render(request, "network/register.html", {
                "message": "Passwords must match."
            })

        # Attempt to create new user
        try:
            user = User.objects.create_user(username, email, password)
            user.save()
        except IntegrityError:
            return render(request, "network/register.html", {
                "message": "Username already taken."
            })
        login(request, user)
        return HttpResponseRedirect(reverse("index"))
    else:
        return render(request, "network/register.html")

def profile(request, username):
    profile_user = get_object_or_404(User, username=username)

    # posts of this user
    posts = Post.objects.filter(
        user=profile_user
    ).order_by("-timestamp")
    posts = annotate_posts(posts, request.user)

    page_obj = paginate_queryset(request, posts, 3)

    # number of followers
    followers_count = Follow.objects.filter(
        following=profile_user
    ).count()

    # number this user follows
    following_count = Follow.objects.filter(
        follower=profile_user
    ).count()

    # check if current logged in user follows this profile
    is_following = False

    if request.user.is_authenticated and request.user != profile_user:
        is_following = Follow.objects.filter(
            follower=request.user,
            following=profile_user
        ).exists()

    return render(request, "network/profile.html", {
        "profile_user": profile_user,
        "page_obj": page_obj,
        "followers_count": followers_count,
        "following_count": following_count,
        "is_following": is_following
    })

@login_required
def follow_toggle(request, user_id):
    if request.method == "PUT":
        target_user = User.objects.get(pk=user_id)

        follow = Follow.objects.filter(
            follower=request.user,
            following=target_user
        )

        if follow.exists():
            follow.delete()
            following = False
        else:
            Follow.objects.create(
                follower=request.user,
                following=target_user
            )
            following = True

        followers_count = Follow.objects.filter(
            following=target_user
        ).count()

        return JsonResponse({
            "following": following,
            "followers_count": followers_count
        })

    return JsonResponse({"error": "PUT required"}, status=400)

@login_required
def like_toggle(request, post_id):
    if request.method == "PUT":
        post = Post.objects.get(pk=post_id)

        like = Like.objects.filter(
            user=request.user,
            post=post
        )

        if like.exists():
            like.delete()
            liked = False
        else:
            Like.objects.create(
                user=request.user,
                post=post
            )
            liked = True

        likes_count = Like.objects.filter(
            post=post
        ).count()

        return JsonResponse({
            "liked": liked,
            "likes_count": likes_count
        })

    return JsonResponse({
        "error": "PUT request required."
    }, status=400)

@login_required
def following(request):
    # users current user is following
    following_users = Follow.objects.filter(
        follower=request.user
    ).values_list("following", flat=True)

    # filter posts from those users
    posts = Post.objects.filter(
        user__in=following_users
    ).order_by("-timestamp")
    posts = annotate_posts(posts, request.user)

    # pagination (same as index)
    page_obj = paginate_queryset(request, posts, 3)

    return render(request, "network/following.html", {
        "page_obj": page_obj
    })

