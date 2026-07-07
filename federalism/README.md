# fed-educ
fed-educ is an educational federalism website aimed at teaching about federalism as the only natural system of governance, which can provide a wide scope of national development

## Automated Health Checks

The repo includes automated backend checks for service and storage health.

Run the full check suite locally:

```bash
cd /home/fred/Documents/fed-educ
bash scripts/run_checks.sh http://localhost:8000
```

Or run only health endpoints:

```bash
python3 scripts/health_check.py http://localhost:8000
```
# fed_educate
