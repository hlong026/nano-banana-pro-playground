# Google OAuth 配置指南

## 问题
错误信息：`Unsupported provider: provider is not enabled`

这表示 Google OAuth 在 Supabase 中没有启用。

## 解决方案

### 步骤 1: 在 Google Cloud Console 创建 OAuth 客户端

1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API：
   - 导航到 "APIs & Services" > "Library"
   - 搜索 "Google+ API"
   - 点击 "Enable"

4. 创建 OAuth 2.0 凭据：
   - 导航到 "APIs & Services" > "Credentials"
   - 点击 "Create Credentials" > "OAuth client ID"
   - 选择 "Web application"
   - 配置：
     - **Name**: Nano Banana Pro (或任意名称)
     - **Authorized JavaScript origins**: 
       ```
       https://your-project.supabase.co
       ```
     - **Authorized redirect URIs**:
       ```
       https://your-project.supabase.co/auth/v1/callback
       ```
   - 点击 "Create"
   - **保存 Client ID 和 Client Secret**

### 步骤 2: 在 Supabase 启用 Google Provider

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目
3. 导航到 **Authentication** > **Providers**
4. 找到 **Google** 并点击展开
5. 配置：
   - ✅ 启用 "Enable Sign in with Google"
   - 输入 **Client ID**（从 Google Cloud Console 获取）
   - 输入 **Client Secret**（从 Google Cloud Console 获取）
   - **Authorized Client IDs**: 留空（除非需要）
6. 点击 **Save**

### 步骤 3: 配置回调 URL

1. 在 Supabase Dashboard
2. 导航到 **Authentication** > **URL Configuration**
3. 添加你的应用 URL：
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: 
     ```
     https://your-app.vercel.app/auth/callback
     http://localhost:3000/auth/callback (开发环境)
     ```
4. 点击 **Save**

### 步骤 4: 测试 Google 登录

1. 访问你的应用
2. 点击 "Sign In"
3. 点击 "Google" 按钮
4. 应该会重定向到 Google 登录页面
5. 授权后重定向回你的应用

## 常见问题

### Q: 为什么需要配置 Google OAuth？
A: Google OAuth 需要在 Google Cloud Console 和 Supabase 两边都配置才能工作。这是为了安全性。

### Q: 可以只使用邮箱/密码登录吗？
A: 可以！邮箱/密码登录不需要额外配置，开箱即用。

### Q: 配置 GitHub OAuth 呢？
A: 类似流程，但在 GitHub Settings > Developer settings > OAuth Apps 创建应用。

### Q: 本地开发如何测试 OAuth？
A: 需要在 Google Cloud Console 和 Supabase 都添加 `http://localhost:3000` 作为授权 URL。

## 快速禁用 OAuth 按钮

如果暂时不想配置 OAuth，可以隐藏这些按钮。编辑 `components/auth/auth-modal.tsx`：

```tsx
// 在 return 语句中，注释掉 OAuth 部分
{/* mode !== "forgot" && (
  <>
    <div className="relative my-4">
      ...OAuth buttons...
    </div>
  </>
) */}
```

或者添加一个环境变量来控制：

```tsx
{mode !== "forgot" && process.env.NEXT_PUBLIC_ENABLE_OAUTH === "true" && (
  // OAuth buttons
)}
```

## 推荐配置

### 开发环境
- ✅ 邮箱/密码登录（无需配置）
- ❌ OAuth（可选，需要配置）

### 生产环境
- ✅ 邮箱/密码登录
- ✅ Google OAuth（推荐配置）
- ✅ GitHub OAuth（可选）

## 相关链接

- [Supabase Auth Providers 文档](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com/)
- [Supabase Dashboard](https://supabase.com/dashboard)
