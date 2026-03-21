from django.urls import path
from .views import QuoteListCreateView

urlpatterns = [
    path('quotes/', QuoteListCreateView.as_view(), name='quote-list-create'),
]
