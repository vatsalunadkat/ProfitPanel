from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    """Wrap all DRF errors in a consistent {error_code, message} envelope."""
    response = exception_handler(exc, context)

    if response is None:
        return Response(
            {
                'error_code': 'SERVER_ERROR',
                'message': 'An unexpected error occurred. Please try again later.',
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    if response.status_code == 400 and isinstance(response.data, dict):
        if 'detail' in response.data and 'parse' in str(response.data['detail']).lower():
            response.data = {
                'error_code': 'INVALID_JSON',
                'message': 'The request body is not valid JSON.',
            }
            return response

    if response.status_code == 405:
        response.data = {
            'error_code': 'METHOD_NOT_ALLOWED',
            'message': f'The {context["request"].method} method is not allowed on this endpoint.',
        }
        return response

    if response.status_code == 404:
        response.data = {
            'error_code': 'NOT_FOUND',
            'message': 'The requested resource was not found.',
        }
        return response

    return response
