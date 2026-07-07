#!/usr/bin/env python3
import json
import sys
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError


def main(api_base='http://localhost:8000'):
    media_id = 1
    url = f'{api_base}/api/media_manager/media_file/{media_id}/signed_url/'
    print(f'Checking signed URL endpoint: {url}')

    try:
        req = Request(url, headers={'Accept': 'application/json'})
        with urlopen(req) as resp:
            data = json.load(resp)
    except HTTPError as e:
        print('HTTP error:', e.code, e.reason)
        sys.exit(1)
    except URLError as e:
        print('URL error:', e.reason)
        sys.exit(1)

    if 'signed_url' not in data:
        print('Failure: signed_url missing in response:', data)
        sys.exit(1)

    signed_url = data['signed_url']
    print('Signed URL received:', signed_url)

    try:
        req = Request(signed_url, headers={'User-Agent': 'fed-educ-test/1.0'})
        with urlopen(req) as resp:
            print('Signed URL HEAD request succeeded:', resp.status)
    except HTTPError as e:
        print('Signed URL HTTP error:', e.code, e.reason)
        sys.exit(1)
    except URLError as e:
        print('Signed URL error:', e.reason)
        sys.exit(1)

    print('Signed URL endpoint test passed.')


if __name__ == '__main__':
    base = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000'
    main(base)
