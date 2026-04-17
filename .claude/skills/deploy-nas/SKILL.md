---
name: deploy-nas
description: Deploy the latest Docker images to the NAS
disable-model-invocation: true
---

# Deploy to NAS

Pull the latest Docker images on the NAS and restart the stack.

## Steps

1. **Verify images are pushed**: Confirm `./build-and-push.sh` has been run since the last code change. If not, run it first.

2. **SSH in and run the pull script**:
```bash
ssh -p 922 wottle@ssh.wottle.com "~/docker/latest_docker_images_pull.sh"
```

3. **Verify containers are healthy**:
```bash
ssh -p 922 wottle@ssh.wottle.com "docker ps --format 'table {{.Names}}\t{{.Status}}'"
```

4. **Check API logs** to confirm migrations ran and startup succeeded:
```bash
ssh -p 922 wottle@ssh.wottle.com "docker logs inventory2-api --tail 30"
```

5. **Report**: Confirm all containers are running and the API started cleanly.
