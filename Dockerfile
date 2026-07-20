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

RUN apk add --no-cache unzip ca-certificates wget && \
    wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip" && \
    unzip -q "pocketbase_${PB_VERSION}_linux_amd64.zip" -d /pb && \
    rm "pocketbase_${PB_VERSION}_linux_amd64.zip"

WORKDIR /pb
COPY pb_hooks ./pb_hooks
COPY pb_migrations ./pb_migrations
COPY pb_schema.json ./pb_schema.json

EXPOSE 8090
VOLUME /pb/pb_data

# Defaults match the app's documented demo credentials — override both in
# production (see DEPLOY.md).
ENV PB_ADMIN_EMAIL=johriretailers@gmail.com
ENV PB_ADMIN_PASSWORD=JohriGolds@123

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090"]
