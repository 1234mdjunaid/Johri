# PocketBase backend image for Johri Jewellers Spin & Win.
#
# Downloads the official PocketBase release binary (pinned to the exact
# version this repo's pb_hooks/pb_migrations were verified against — see
# README's "PocketBase limitations" section for why pinning matters here)
# and bundles this repo's pb_hooks, pb_migrations, and pb_schema.json.
#
# On first boot, pb_migrations/1700000000_setup.js automatically imports the
# schema and creates the admin login, a starter settings record, and 6
# starter offers — no manual setup required. See DEPLOY.md.

FROM alpine:3.20

ARG PB_VERSION=0.39.8
# Set automatically by `docker build`/buildx to arm64 or amd64 — matters if
# you're deploying to an ARM VM (e.g. Oracle Cloud's free-tier Ampere A1
# instances, see DEPLOY.md), where the amd64 binary simply won't run.
ARG TARGETARCH

RUN apk add --no-cache unzip ca-certificates wget && \
    case "${TARGETARCH}" in \
      arm64) PB_ARCH=arm64 ;; \
      *) PB_ARCH=amd64 ;; \
    esac && \
    wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" && \
    unzip -q "pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip" -d /pb && \
    rm "pocketbase_${PB_VERSION}_linux_${PB_ARCH}.zip"

WORKDIR /pb
COPY pb_hooks ./pb_hooks
COPY pb_migrations ./pb_migrations
COPY pb_schema.json ./pb_schema.json

EXPOSE 8090
# No VOLUME instruction here on purpose: Railway's build system rejects
# Dockerfiles that declare one ("VOLUME ... is not supported"). Persistence
# on Railway comes entirely from the Volume you mount at /pb/pb_data in its
# dashboard (see DEPLOY.md); on plain Docker/Compose the named volume in
# docker-compose.yml handles it the same way without needing this line.

# Defaults match the app's documented demo credentials — override both in
# production (see DEPLOY.md).
ENV PB_ADMIN_EMAIL=johriretailers@gmail.com
ENV PB_ADMIN_PASSWORD=JohriGolds@123

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
