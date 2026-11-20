# Assinatura do APK

O Android só instala uma atualização por cima se ela for assinada com **a mesma chave**. Sem chave configurada, o CI usa uma chave temporária a cada versão (o APK instala, mas para atualizar é preciso desinstalar o anterior).

## Criar a chave (uma vez)

```bash
keytool -genkeypair -v -keystore ferramentas-live.jks -alias ferramentas \
  -keyalg RSA -keysize 2048 -validity 10000
```

Guarde o arquivo `.jks` e a senha em lugar seguro — se perder, não dá para atualizar o app instalado nos aparelhos.

## Cadastrar no GitHub

_Settings → Secrets and variables → Actions → New repository secret_:

| Nome                        | Valor                                                                                   |
| --------------------------- | --------------------------------------------------------------------------------------- |
| `ANDROID_KEYSTORE_BASE64`   | saída de `base64 -w0 ferramentas-live.jks` (no macOS: `base64 -i ferramentas-live.jks`) |
| `ANDROID_KEYSTORE_PASSWORD` | a senha escolhida                                                                       |
| `ANDROID_KEY_ALIAS`         | `ferramentas`                                                                           |

Pronto: as próximas releases saem assinadas com a sua chave.

## Qual APK baixar

- `android-arm64` — praticamente todos os celulares atuais.
- `android-arm` — aparelhos antigos de 32 bits.
