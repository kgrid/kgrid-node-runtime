# Use the following command to build the image:
# sudo docker build --build-arg kgrid_proxy_adapter_url=<Activator Url> --build-arg kgrid_node_env_url=<Node Runtime Url> --build-arg kgrid_node_env_port=<Node Runtime Port> --build-arg kgrid_node_cache_strategy=<ALWAYS, NEVER, USE_CHECKSUM> -t node .

# Use the following command to run the image:
# sudo docker run --network host node

FROM node:latest
MAINTAINER kgrid (kgrid-developers@umich.edu)

ARG kgrid_proxy_adapter_url
ARG kgrid_node_env_url
ARG kgrid_node_env_port
ARG kgrid_node_cache_strategy

ENV KGRID_PROXY_ADAPTER_URL=$kgrid_proxy_adapter_url
ENV KGRID_NODE_ENV_URL=$kgrid_node_env_url
ENV KGRID_NODE_ENV_PORT=$kgrid_node_env_port
ENV KGRID_NODE_CACHE_STRATEGY=$kgrid_node_cache_strategy

RUN npm install -g @kgrid/noderuntime

ENTRYPOINT kgrid-node

