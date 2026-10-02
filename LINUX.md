# Uso en Linux (Arch, Manjaro u otras distribuciones)

Abre una terminal en la carpeta raíz de este repositorio clonado. Para revisar archivos y editar código, no necesitas ejecutar el servidor: usa tu editor y Git normalmente. Los comandos siguientes sirven para abrir la aplicación local. Detén un servidor con `Ctrl+C`. Los archivos `.command` son accesos rápidos de macOS; en Linux usa estos comandos.

## Apps estáticas

Puedes abrir `app1/index.html` desde el navegador sin servidor. `app2/dist/index.html` está versionado. Si modificas el contenido de App 2, instala Node.js y npm y reconstruye desde su carpeta:

```sh
cd app2
npm install
npm run build
```

Luego abre `dist/index.html`. Véase [app2/README.md](app2/README.md).
