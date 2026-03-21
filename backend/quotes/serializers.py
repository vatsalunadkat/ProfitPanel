from rest_framework import serializers
from .models import Quote


class QuoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Quote
        fields = ['id', 'name', 'email', 'address', 'monthly_bill',
                  'estimated_savings', 'created_at']
        read_only_fields = ['id', 'estimated_savings', 'created_at']
