#!/usr/bin/env python3
import json
import sys
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError


def check_url(url):
    req = Request(url, headers={'Accept': 'application/json'})
    try:
        with urlopen(req) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            print(f'OK: {url}')
            print(json.dumps(data, indent=2))
    except HTTPError as e:
        print(f'HTTP error for {url}: {e.code} {e.reason}')
        sys.exit(1)
    except URLError as e:
        print(f'URL error for {url}: {e.reason}')
        sys.exit(1)


def main(base_url='http://localhost:8000'):
    check_url(f'{base_url}/api/health/')
    check_url(f'{base_url}/api/health/storage/')


if __name__ == '__main__':
    base = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8000'
    main(base)
