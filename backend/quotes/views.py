from decimal import Decimal

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from drf_spectacular.utils import (
    extend_schema,
    extend_schema_view,
    inline_serializer,
    OpenApiExample,
)
from rest_framework import serializers as _s

from .models import Quote
from .serializers import QuoteSerializer

_ValidationErrorSerializer = inline_serializer(
    name='ValidationError',
    fields={
        'error_code': _s.CharField(),
        'message': _s.CharField(),
        'field_errors': _s.DictField(child=_s.ListField(child=_s.CharField())),
    },
)


@extend_schema_view(
    get=extend_schema(
        summary='List all quotes',
        description='Returns every quote stored in the database, ordered newest first.',
        tags=['Quotes'],
        responses={200: QuoteSerializer(many=True)},
    ),
    post=extend_schema(
        summary='Submit a new quote',
        description=(
            'Accepts customer details and a monthly electricity bill, '
            'calculates estimated savings (bill × 30%), and stores the quote. '
            'Returns the created quote including the computed `estimated_savings` and `created_at` timestamp.'
        ),
        tags=['Quotes'],
        request=QuoteSerializer,
        responses={
            201: QuoteSerializer,
            400: _ValidationErrorSerializer,
        },
        examples=[
            OpenApiExample(
                'Valid request',
                value={
                    'name': 'Jane Smith',
                    'email': 'jane@example.com',
                    'address': '1 Solar Street, Stockholm',
                    'monthly_bill': '1500.00',
                },
                request_only=True,
            ),
            OpenApiExample(
                'Validation error',
                value={
                    'error_code': 'VALIDATION_ERROR',
                    'message': 'One or more fields have errors.',
                    'field_errors': {'email': ['Enter a valid email address.']},
                },
                response_only=True,
                status_codes=['400'],
            ),
        ],
    ),
)
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


@extend_schema_view(
    get=extend_schema(
        summary='Retrieve a single quote',
        description='Returns a single quote by its ID.',
        tags=['Quotes'],
        responses={
            200: QuoteSerializer,
            404: inline_serializer(
                name='NotFoundError',
                fields={
                    'error_code': _s.CharField(),
                    'message': _s.CharField(),
                },
            ),
        },
    ),
    put=extend_schema(
        summary='Update a quote',
        description='Updates the editable fields of a quote and recalculates estimated savings.',
        tags=['Quotes'],
        request=QuoteSerializer,
        responses={
            200: QuoteSerializer,
            400: _ValidationErrorSerializer,
            404: inline_serializer(
                name='NotFoundErrorPut',
                fields={
                    'error_code': _s.CharField(),
                    'message': _s.CharField(),
                },
            ),
        },
    ),
    delete=extend_schema(
        summary='Delete a quote',
        description='Permanently deletes a quote by its ID.',
        tags=['Quotes'],
        responses={
            204: None,
            404: inline_serializer(
                name='NotFoundErrorDelete',
                fields={
                    'error_code': _s.CharField(),
                    'message': _s.CharField(),
                },
            ),
        },
    ),
)
class QuoteDetailView(APIView):

    def _get_quote(self, pk):
        try:
            return Quote.objects.get(pk=pk)
        except Quote.DoesNotExist:
            return None

    def get(self, request, pk):
        """Return a single quote by ID."""
        quote = self._get_quote(pk)
        if quote is None:
            return Response(
                {'error_code': 'NOT_FOUND', 'message': 'Quote not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = QuoteSerializer(quote)
        return Response(serializer.data)

    def put(self, request, pk):
        """Update a quote's editable fields and recalculate savings."""
        quote = self._get_quote(pk)
        if quote is None:
            return Response(
                {'error_code': 'NOT_FOUND', 'message': 'Quote not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        serializer = QuoteSerializer(quote, data=request.data)
        if serializer.is_valid():
            monthly_bill = serializer.validated_data['monthly_bill']
            estimated_savings = round(monthly_bill * Decimal('0.3'), 2)
            serializer.save(estimated_savings=estimated_savings)
            return Response(serializer.data)
        return Response(
            {
                'error_code': 'VALIDATION_ERROR',
                'message': 'One or more fields have errors.',
                'field_errors': serializer.errors,
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    def delete(self, request, pk):
        """Delete a quote by ID."""
        quote = self._get_quote(pk)
        if quote is None:
            return Response(
                {'error_code': 'NOT_FOUND', 'message': 'Quote not found.'},
                status=status.HTTP_404_NOT_FOUND,
            )
        quote.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
