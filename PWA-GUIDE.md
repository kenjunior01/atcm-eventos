# Guia PWA - ATCM Eventos

## Visão Geral

O sistema ATCM Eventos foi transformado em um Progressive Web App (PWA) completo, permitindo instalação como app nativo em dispositivos móveis e desktop.

## Recursos PWA Implementados

### 1. Service Worker (`public/sw.js`)
- **Cache de recursos:** Cache automático de páginas estáticas
- **Offline support:** Funcionalidade básica offline
- **Background sync:** Preparado para sincronização de dados offline
- **Cache strategy:** Network-first com fallback para cache

### 2. Manifest PWA (`public/manifest.json`)
- **Display mode:** Standalone (sem barra de endereço)
- **Ícones:** Múltiplos tamanhos para todos os dispositivos
- **Shortcuts:** Atalhos para "Eventos" e "Minhas Inscrições"
- **Screenshots:** Screenshots para lojas de apps
- **Categories:** Classificação como "sports" e "productivity"

### 3. Componente de Instalação (`src/components/PWAInstallPrompt.tsx`)
- **Prompt personalizado:** Botão de instalação customizado
- **Detecção automática:** Mostra apenas quando não está instalado
- **UX otimizada:** Botão flutuante no canto inferior direito

### 4. Meta Tags Completas (`src/app/layout.tsx`)
- **Apple Web App:** Suporte completo para iOS
- **Windows Tile:** Configuração para Windows
- **Theme Color:** Cor de tema consistente
- **Viewport:** Otimizado para mobile

## Como Instalar o PWA

### Android (Chrome)
1. Abra o app no Chrome
2. Toque no menu (três pontos)
3. Selecione "Adicionar à tela inicial"
4. Confirme a instalação

### iOS (Safari)
1. Abra o app no Safari
2. Toque no botão de compartilhar (quadrado com seta)
3. Role para baixo e selecione "Adicionar à Tela de Início"
4. Confirme a instalação

### Desktop (Chrome/Edge)
1. Abra o app no navegador
2. Clique no ícone de instalação na barra de endereço
3. Clique em "Instalar"
4. Confirme a instalação

## Testando o PWA

### Chrome DevTools
1. Abra DevTools (F12)
2. Vá para a aba "Application"
3. Verifique:
   - **Manifest:** Se o manifesto está carregado corretamente
   - **Service Workers:** Se o service worker está ativo
   - **Storage:** Se o cache está funcionando

### Lighthouse
1. Abra DevTools
2. Vá para a aba "Lighthouse"
3. Selecione "Progressive Web App"
4. Execute "Analyze page load"
5. Verifique a pontuação PWA (deve ser >90)

## Ícones Necessários

Para uma experiência completa, crie os seguintes ícones na pasta `public/`:

- `icon-72.png` (72x72)
- `icon-96.png` (96x96)
- `icon-128.png` (128x128)
- `icon-144.png` (144x144)
- `icon-152.png` (152x152)
- `icon-192.png` (192x192)
- `icon-310.png` (310x310)
- `icon-384.png` (384x384)
- `icon-512.png` (512x512)
- `favicon.ico`
- `screenshot-wide.png` (1280x720)
- `screenshot-narrow.png` (750x1334)

### Gerando Ícones

Use ferramentas como:
- [Favicon.io](https://favicon.io/)
- [RealFaviconGenerator](https://realfavicongenerator.net/)
- [AppIconGenerator](https://appicon.co/)

## Offline Support

O PWA atual suporta:
- ✅ Navegação offline de páginas cacheadas
- ✅ Cache de recursos estáticos
- ⏳ Sincronização de dados (requer implementação adicional)

### Implementando Sincronização Offline

Para sincronização completa de dados (inscrições, etc.), implemente:

1. **IndexedDB** para armazenar dados offline
2. **Background Sync API** para sincronizar quando online
3. **UI de indicador de status** (online/offline)

Exemplo de implementação:

```typescript
// Verificar status de conexão
window.addEventListener('online', () => {
  // Sincronizar dados pendentes
  syncPendingData()
})

window.addEventListener('offline', () => {
  // Mostrar indicador offline
  showOfflineIndicator()
})
```

## Atalhos PWA

O manifest inclui atalhos para acesso rápido:

### Atalho: Eventos
- **Nome:** Eventos
- **URL:** /eventos
- **Descrição:** Ver eventos disponíveis

### Atalho: Minhas Inscrições
- **Nome:** Inscrições
- **URL:** /inscricoes
- **Descrição:** Ver minhas inscrições

## Performance PWA

### Métricas Alvo
- **First Contentful Paint (FCP):** < 1.8s
- **Largest Contentful Paint (LCP):** < 2.5s
- **Time to Interactive (TTI):** < 3.8s
- **Cumulative Layout Shift (CLS):** < 0.1

### Otimizações Implementadas
- Service Worker para cache
- Lazy loading de componentes
- Otimização de imagens
- Code splitting automático do Next.js

## Deploy no Vercel

O PWA funciona perfeitamente no Vercel sem configurações adicionais. O service worker e manifest são servidos automaticamente.

## Troubleshooting

### Service Worker não registra
- Verifique se o arquivo `sw.js` está em `public/`
- Verifique o console do navegador para erros
- Certifique-se de que está servindo via HTTPS (obrigatório para PWA)

### Botão de instalação não aparece
- O usuário já instalou o app
- O navegador não suporta PWA (verifique caniuse.com)
- O manifesto não está carregando (verifique DevTools)

### Ícones não aparecem
- Verifique se os arquivos de ícone existem em `public/`
- Verifique os caminhos no `manifest.json`
- Limpe o cache do navegador

## Próximos Passos

1. Criar todos os ícones necessários
2. Implementar sincronização offline completa
3. Adicionar push notifications
4. Criar screenshots para lojas
5. Testar em múltiplos dispositivos
6. Submeter para lojas (Google Play, Apple App Store)

## Recursos

- [PWA Best Practices](https://web.dev/progressive-web-apps/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [PWA Checklist](https://web.dev/pwa-checklist/)
