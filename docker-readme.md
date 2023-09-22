# Docker support

## Requirements

- [Docker CE - 19.03.3+](https://docs.docker.com/engine/install/)
- [Docker Compose - 1.19.0+](https://docs.docker.com/compose/install/)

## Running containers

You can use docker-compose directly, or the nifty `make` that comes bundled.

### Build images

```shell script
make build
```

#### Starting containers in background:

```shell script
make up
```

#### Run tests

```shell
make test
```

#### Start hardhat node
```shell
make hardhat.start
```

#### Stop containers

```shell script
make down
```

#### Using docker-compose instead of make

```shell script
docker-compose up
```
