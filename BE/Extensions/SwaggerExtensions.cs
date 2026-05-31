using System.Reflection;
using Exe.Swagger;
using Microsoft.OpenApi.Models;

namespace Exe.Extensions;

public static class SwaggerExtensions
{
    public static IServiceCollection AddSwaggerDocumentation(this IServiceCollection services)
    {
        services.AddEndpointsApiExplorer();
        services.AddSwaggerGen(options =>
        {
            options.SwaggerDoc("v1", new OpenApiInfo
            {
                Title = "EXE Game Asset Marketplace API",
                Version = "v1",
                Description = """
                    REST API cho nền tảng marketplace asset game AI.

                    **Base path:** `/api/v1`

                    **Auth:** Supabase JWT — header `Authorization: Bearer {access_token}`

                    **HTTP codes:** 200 OK · 201 Created · 204 No Content · 400 · 401 · 403 · 404 · 409

                    **Pagination:** `?page=1&pageSize=20` → `{ data, page, pageSize, total }`

                    **Sort:** `?sort=createdAt&order=desc`

                    Legend: Public · Auth (JWT) · Admin
                    """,
                Contact = new OpenApiContact
                {
                    Name = "EXE Team"
                }
            });

            var xmlFile = $"{Assembly.GetExecutingAssembly().GetName().Name}.xml";
            var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
            if (File.Exists(xmlPath))
                options.IncludeXmlComments(xmlPath, includeControllerXmlComments: true);

            options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Description = """
                    Supabase access token.

                    1. Gọi `POST /api/v1/auth/login` hoặc đăng nhập qua Supabase client
                    2. Copy `accessToken` từ response
                    3. Bấm **Authorize** và nhập: `Bearer {accessToken}`
                    """,
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT"
            });

            options.OperationFilter<AuthorizeCheckOperationFilter>();

            options.TagActionsBy(api =>
            {
                if (api.ActionDescriptor is Microsoft.AspNetCore.Mvc.Controllers.ControllerActionDescriptor descriptor)
                {
                    var tag = descriptor.ControllerTypeInfo
                        .GetCustomAttributes(typeof(Microsoft.AspNetCore.Http.TagsAttribute), inherit: true)
                        .Cast<Microsoft.AspNetCore.Http.TagsAttribute>()
                        .SelectMany(a => a.Tags)
                        .FirstOrDefault();

                    if (!string.IsNullOrEmpty(tag))
                        return [tag];
                }

                return [api.GroupName ?? api.ActionDescriptor.RouteValues["controller"] ?? "Default"];
            });

            options.OrderActionsBy(apiDesc => apiDesc.RelativePath);
        });

        return services;
    }

    public static WebApplication UseSwaggerDocumentation(this WebApplication app)
    {
        app.UseSwagger(options =>
        {
            options.RouteTemplate = "swagger/{documentName}/swagger.json";
        });

        app.UseSwaggerUI(options =>
        {
            options.SwaggerEndpoint("/swagger/v1/swagger.json", "EXE Marketplace API v1");
            options.RoutePrefix = "swagger";
            options.DocumentTitle = "EXE API — Swagger";
            options.DisplayRequestDuration();
            options.EnablePersistAuthorization();
            options.EnableTryItOutByDefault();
            options.DefaultModelsExpandDepth(2);
            options.DefaultModelExpandDepth(2);
        });

        app.MapGet("/", () => Results.Redirect("/swagger"))
            .ExcludeFromDescription();

        return app;
    }
}
