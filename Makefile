# ====================================================================================
# init

SHELL:=/bin/bash

ifneq ($(shell test -s .env && echo -n yes),yes)
ifeq ($(shell test -s .env.dist && echo -n yes),yes)
$(shell cp .env.dist .env)
$(shell chmod o+rw .env)
endif
endif

-include .env

export

# ====================================================================================
# env

PROJECT_NAME?=bepro
PROJECT_URL?=-
PROJECT_VENDOR?=-
PROJECT_DESCRIPTION?=-


# ======================================================================================================================
# make command

.PHONY:

all: help

# ssl ------------------------------------------------------------------------------------------------------------------

help: Makefile
	@echo " Available command(s):"
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'

## up	- Create and start containers.
up:
	@docker-compose -p ${PROJECT_NAME} up -d
## down	- Teardown and stop containers.
down:
	@docker-compose -p ${PROJECT_NAME} down

## build	- Build images.
build:
	@docker-compose -p ${PROJECT_NAME} build

## test	- Run tests
test:
	@docker-compose -p ${PROJECT_NAME} exec bepro npm run test

## hardhat.start	- Start hardhat node
hardhat.start:
	@docker-compose -p ${PROJECT_NAME} exec bepro npm run hardhat:start
