# PESTAPORA 2026 - Cloud / Kubernetes Deployment

Containerized Next.js app orchestrated by Kubernetes with horizontal autoscaling
(HPA). The database stays on Supabase (managed Postgres). Under a flash-sale
surge, Kubernetes scales the app pods 2 -> 10 while a Postgres row lock
guarantees zero overselling.

## Architecture

| Layer | Tech | Cloud concept demonstrated |
| --- | --- | --- |
| Container | Docker (multi-stage, standalone) | Portability / IaaS building block |
| Orchestration | Kubernetes Deployment + Service | Resource pooling, self-healing |
| Autoscaling | HorizontalPodAutoscaler (2 -> 10) | Rapid elasticity |
| Load test | k6 | Measured service |
| Database | Supabase (managed Postgres) | DBaaS, data consistency under load |

## Prerequisites (Windows / PowerShell)

- Docker Desktop
- minikube + kubectl
- k6  (winget install k6.k6  or  choco install k6)

## 1. Start the cluster + metrics-server (required for HPA)

```powershell
minikube start --driver=docker --cpus=4 --memory=6g
minikube addons enable metrics-server
```

## 2. Build the image INTO minikube's Docker daemon

```powershell
# Point this shell's docker CLI at minikube
& minikube -p minikube docker-env --shell powershell | Invoke-Expression

# Build (public NEXT_PUBLIC values are safe to bake in)
docker build -t pestapora-web:local `
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://sfaukivspbpmqmshdfdp.supabase.co `
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_iDBm3yjbzeOOcjJvu9f30w_PMVaWd-G `
  --build-arg NEXT_PUBLIC_PAYMENT_MODE=simulasi `
  .
```

## 3. Create namespace + secret (server-only keys, never committed)

```powershell
kubectl apply -f k8s/namespace.yaml

kubectl -n pestapora create secret generic pestapora-secret `
  --from-literal=SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key> `
  --from-literal=MIDTRANS_SERVER_KEY=<your-midtrans-server-key> `
  --from-literal=ADMIN_RESET_TOKEN=<any-random-string>
```

## 4. Deploy

```powershell
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml
kubectl apply -f k8s/hpa.yaml

kubectl -n pestapora get pods -w
```

## 5. Open the app

```powershell
minikube service pestapora-web -n pestapora --url
# -> prints a URL like http://127.0.0.1:53217  (keep this terminal open)
```

## 6. The money shot: autoscaling under load

```powershell
# Terminal A - watch HPA + pods live
kubectl -n pestapora get hpa,pods -w

# Terminal B - hammer the URL from step 5
k6 run -e BASE_URL=<URL-from-step-5> -e STOCK=100 loadtest/k6-flashsale.js
```

The pod count climbs from 2 toward 10 once average CPU passes 50%, then scales
back down ~60s after the test ends. The k6 summary proves at most 100 successful
purchases - the system never oversells.

## 7. Reset stock between takes

Re-run supabase/seed.sql in the Supabase SQL Editor, then run:

```sql
delete from public.orders;
```
