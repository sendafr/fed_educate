#!/usr/bin/env python3
"""
Check media signed URLs from the backend debug endpoints.

Usage:
  python3 scripts/check_signed_url.py --base https://your-backend.example --id 123 --kind file

Kinds: 'file' or 'upload'

This script calls the debug endpoint added to the backend, prints the JSON response,
and attempts a HEAD and small GET to the returned signed URL to show status codes.
"""
import argparse
import json
import sys
from urllib.parse import urljoin

import requests


def extract_signed_url(data):
    # multiple possible shapes
    candidates = [
        lambda d: d.get('signed_url'),
        lambda d: d.get('signedUrl'),
        lambda d: d.get('url'),
        lambda d: d.get('data', {}).get('signed_url'),
        lambda d: d.get('data', {}).get('signedUrl'),
        lambda d: d.get('data', {}).get('url'),
    ]
    for c in candidates:
        try:
            v = c(data)
            if v:
                return v
        except Exception:
            continue
    return None


def call_debug(base, kind, id_):
    if kind == 'file':
        path = f'/api/media_manager/media_file/{id_}/debug_signed_url/'
    else:
        path = f'/api/media_manager/media_uploads/{id_}/debug_signed_url/'

    url = base.rstrip('/') + path
    print(f'Calling debug endpoint: {url}')

    try:
        resp = requests.get(url, timeout=15)
    except Exception as e:
        print('ERROR calling backend debug endpoint:', e)
        sys.exit(2)

    try:
        data = resp.json()
    except Exception:
        print('Non-JSON response from backend:')
        print(resp.text[:1000])
        sys.exit(2)

    print('--- Backend JSON ---')
    print(json.dumps(data, indent=2))

    signed = extract_signed_url(data)
    if not signed:
        print('\nNo signed URL found in response. Check object_key / head_object fields above.')
        return 1

    print('\nSigned URL:', signed)

    # Try HEAD
    try:
        h = requests.head(signed, allow_redirects=True, timeout=15)
        print('\nHEAD status:', h.status_code)
        for k in ('Content-Length', 'Content-Type', 'Content-Disposition'):
            if k in h.headers:
                print(f'{k}:', h.headers[k])
    except Exception as e:
        print('HEAD request failed:', e)

    # Try GET small range
    try:
        g = requests.get(signed, stream=True, timeout=30)
        print('\nGET status:', g.status_code)
        cl = g.headers.get('content-length')
        print('Content-Length header:', cl)
        chunk = b''
        try:
            for i, part in enumerate(g.iter_content(chunk_size=8192)):
                chunk += part
                if i >= 1:
                    break
        finally:
            g.close()
        print('Downloaded bytes:', len(chunk))
    except Exception as e:
        print('GET request failed:', e)

    return 0


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--base', '-b', required=True, help='Backend base URL (e.g. https://api.example)')
    p.add_argument('--id', '-i', required=True, help='Media id to check')
    p.add_argument('--kind', choices=['file', 'upload'], default='file')
    args = p.parse_args()

    rc = call_debug(args.base, args.kind, args.id)
    sys.exit(rc)


if __name__ == '__main__':
    main()
