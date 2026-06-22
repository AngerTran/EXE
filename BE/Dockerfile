FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

COPY Exe.csproj ./
RUN dotnet restore

COPY . ./
RUN dotnet publish Exe.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

ENV ASPNETCORE_URLS=http://0.0.0.0:10000
ENV ASPNETCORE_ENVIRONMENT=Production
ENV DOTNET_USE_POLLING_FILE_WATCHER=1
EXPOSE 10000

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Exe.dll"]
