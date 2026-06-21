# Shared multi-stage build for every VolunteerHub .NET 8 microservice.
# Build context MUST be the repository root (services share project references / linked controllers).
#
#   docker build -f deploy/dotnet-service.Dockerfile \
#     --build-arg PROJECT=BaseCore.EventService/BaseCore.EventService.csproj \
#     --build-arg DLL=BaseCore.EventService.dll -t volunteerhub-eventservice .

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
ARG PROJECT
WORKDIR /src
COPY . .
RUN dotnet restore "$PROJECT"
RUN dotnet publish "$PROJECT" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
ARG DLL
WORKDIR /app
# curl is used by the docker-compose healthchecks (/health endpoint).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_RUNNING_IN_CONTAINER=true \
    APP_DLL=${DLL}
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "exec dotnet \"$APP_DLL\""]
