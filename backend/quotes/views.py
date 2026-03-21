from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Quote
from .serializers import QuoteSerializer


class QuoteListCreateView(APIView):

    def get(self, request):
        """Return all quotes, newest first."""
        quotes = Quote.objects.all()
        serializer = QuoteSerializer(quotes, many=True)
        return Response(serializer.data)

    def post(self, request):
        """Accept a new quote, calculate savings, and save."""
        serializer = QuoteSerializer(data=request.data)
        if serializer.is_valid():
            monthly_bill = serializer.validated_data['monthly_bill']
            estimated_savings = round(monthly_bill * Decimal('0.3'), 2)
            serializer.save(estimated_savings=estimated_savings)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(
            {
                'error_code': 'VALIDATION_ERROR',
                'message': 'One or more fields have errors.',
                'field_errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )
