from django.http import HttpResponse

class MediaCORSHeaderMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        print(">>> MEDIA CORS MIDDLEWARE LOADED <<<")

    def __call__(self, request):
        print(f">>> REQUEST: {request.method} {request.path}")
        
        if request.method == 'OPTIONS':
            response = HttpResponse()
            response['Access-Control-Allow-Origin'] = 'https://fed-educ.vercel.app'
            response['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Range, Content-Type, Authorization'
            response['Access-Control-Allow-Credentials'] = 'true'
            response['Cross-Origin-Resource-Policy'] = 'cross-origin'
            return response

        response = self.get_response(request)
        
        # Add to ALL responses for testing
        response['Access-Control-Allow-Origin'] = 'https://fed-educ.vercel.app'
        response['Access-Control-Allow-Credentials'] = 'true'
        response['Cross-Origin-Resource-Policy'] = 'cross-origin'
        response['Cross-Origin-Opener-Policy'] = 'same-origin'
        
        return response