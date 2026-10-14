<?php
// Formulario de contacto. Lo usan /contacto/ y /en/contact/ (campo oculto «idioma»).
// Envía el aviso a info@urbecan.com con mail() del hosting y redirige a la página de gracias de cada idioma.
// El remitente es un buzón del dominio alojado en el mismo hosting: así el aviso sale firmado y no cae en spam.
// Compatible con PHP 7.4+.

const DESTINO = 'info@urbecan.com';
const REMITENTE = 'info@urbecan.com';

date_default_timezone_set('Atlantic/Canary');

$en = ($_POST['idioma'] ?? '') === 'en';
$gracias = $en ? '/en/thanks/' : '/gracias/';
$formulario = $en ? '/en/contact/' : '/contacto/';

function ir(string $url): void {
  header('Location: ' . $url, true, 303);
  exit;
}

function campo(string $nombre, int $max): string {
  $v = trim(str_replace(["\r\n", "\r"], "\n", (string)($_POST[$nombre] ?? '')));
  return function_exists('mb_substr') ? mb_substr($v, 0, $max, 'UTF-8') : substr($v, 0, $max);
}

function linea(string $v): string {
  return trim(preg_replace('/\s+/u', ' ', $v) ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') ir($formulario);

$nombre = linea(campo('nombre', 120));
$email = linea(campo('email', 160));
$telefono = linea(campo('telefono', 40));
$tipo = linea(campo('tipo', 60));
$mensaje = campo('mensaje', 5000);

// Spam: el campo trampa solo lo rellenan los bots, y los mensajes reales no llevan una lista de enlaces.
// A los dos se les manda a «gracias» sin enviar nada, para que no insistan.
if (campo('bot-field', 200) !== '' || substr_count(strtolower($mensaje), 'http') > 3) ir($gracias);

if ($nombre === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || campo('consentimiento', 10) === '') {
  pagina_error($en, 400);
}

$asunto = 'Nueva solicitud desde la web' . ($en ? ' (versión en inglés)' : '');
$cuerpo = implode("\n", [
  'Nombre: ' . $nombre,
  'Email: ' . $email,
  'Teléfono: ' . ($telefono !== '' ? $telefono : '—'),
  'Interés: ' . ($tipo !== '' ? $tipo : '—'),
  '',
  'Mensaje:',
  $mensaje !== '' ? $mensaje : '—',
  '',
  'Acepta la política de privacidad: Sí',
  'Enviado desde la web en ' . ($en ? 'inglés' : 'español') . ' el ' . date('d/m/Y \a \l\a\s H:i'),
]);
$cabeceras = implode("\r\n", [
  'From: Web Urbecan <' . REMITENTE . '>',
  'Reply-To: ' . $email,
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: 8bit',
]);

if (mail(DESTINO, '=?UTF-8?B?' . base64_encode($asunto) . '?=', $cuerpo, $cabeceras, '-f' . REMITENTE)) ir($gracias);
pagina_error($en, 500);

// Página mínima de error (casi nunca se ve: el navegador ya valida los campos obligatorios)
function pagina_error(bool $en, int $codigo): void {
  http_response_code($codigo);
  header('Content-Type: text/html; charset=UTF-8');
  $t = $en
    ? ['en', 'Message not sent', 'Your message could not be sent.', 'Please go back and try again, or contact us at', 'Go back']
    : ['es', 'No se ha enviado', 'No hemos podido enviar tu mensaje.', 'Vuelve atrás e inténtalo de nuevo, o escríbenos a', 'Volver'];
  echo '<!doctype html><html lang="' . $t[0] . '"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow">'
    . '<meta name="viewport" content="width=device-width,initial-scale=1"><title>' . $t[1] . ' | Urbecan</title>'
    . '<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f5f3ec;color:#142235;font:16px/1.6 system-ui,sans-serif;padding:24px}'
    . 'main{max-width:460px}h1{color:#08295d;font-size:26px;margin:0 0 12px}a{color:#08295d}</style></head><body><main>'
    . '<h1>' . $t[2] . '</h1><p>' . $t[3] . ' <a href="mailto:info@urbecan.com">info@urbecan.com</a> · WhatsApp '
    . '<a href="https://wa.me/34656611500">656 61 15 00</a>.</p><p><a href="javascript:history.back()">← ' . $t[4] . '</a></p>'
    . '</main></body></html>';
  exit;
}
