#!/usr/bin/env node

/**
 * 认证配置测试脚本
 * 运行: node scripts/test-auth.js
 */

console.log('🔍 检查认证配置...\n')

// 检查环境变量
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log('📋 环境变量检查:')
console.log('─'.repeat(50))

if (supabaseUrl) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL: 未配置')
}

if (supabaseKey) {
  console.log('✅ NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey.substring(0, 20) + '...')
} else {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY: 未配置')
}

console.log('\n📝 配置状态:')
console.log('─'.repeat(50))

if (supabaseUrl && supabaseKey) {
  console.log('✅ Supabase 配置完整')
  console.log('\n🎯 下一步:')
  console.log('1. 访问 Supabase Dashboard')
  console.log('2. 检查 Authentication > Settings')
  console.log('3. 确认邮箱确认设置')
  console.log('4. 测试注册和登录')
} else {
  console.log('❌ Supabase 配置不完整')
  console.log('\n🔧 修复步骤:')
  console.log('1. 创建 .env.local 文件')
  console.log('2. 添加以下内容:')
  console.log('   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co')
  console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key')
  console.log('3. 重启开发服务器')
  console.log('\n📚 获取这些值:')
  console.log('   https://supabase.com/dashboard/project/_/settings/api')
}

console.log('\n' + '─'.repeat(50))
console.log('📖 完整文档: 查看 AUTH_ANALYSIS.md')
console.log('─'.repeat(50) + '\n')
