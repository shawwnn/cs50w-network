from django.core.paginator import Paginator
from django.db.models import Count, Exists, OuterRef
from .models import Like

def paginate_queryset(request, queryset, per_page=10):
    paginator = Paginator(queryset, per_page)
    page_number = request.GET.get("page")
    return paginator.get_page(page_number)

def annotate_posts(posts, user):
    posts = posts.annotate(
        like_count=Count("likes", distinct=True)) # adjust if related name differs 
                           
    if user.is_authenticated: 
        posts = posts.annotate( 
            is_liked=Exists( 
                Like.objects.filter( 
                    user=user, post=OuterRef("pk") 
                ) 
            )
        ) 
    return posts