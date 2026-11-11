<?php
// The form of the site (assets/contact.js posts here, same origin). It checks the data, keeps every request in a file OUTSIDE public_html
// (../mml-data/intake.jsonl) and emails contact@minemylead.com. Nothing is ever sent to the visitor from here.
declare(strict_types=1);

const TO = 'contact@minemylead.com';   // who gets the email
const FROM = 'contact@minemylead.com'; // a mailbox of this domain, so Hostinger's mail accepts it
const MAX_PER_HOUR = 40;

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
function out(int $code, array $body): void { http_response_code($code); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') out(405, ['error' => 'method not allowed']);

$f = json_decode((string) file_get_contents('php://input'), true);
if (!is_array($f)) $f = $_POST;
$clip = static fn($v, int $n): string => mb_substr(trim((string) preg_replace('/\s+/u', ' ', (string) ($v ?? ''))), 0, $n);

if ($clip($f['hp'] ?? '', 50) !== '') out(200, ['ok' => true]); // honeypot: pretend it worked

$email = strtolower($clip($f['email'] ?? '', 254));
if (!preg_match('/^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,}$/', $email)) out(400, ['error' => 'check the email']);

// a website (https, public host) or an @handle
$site = $clip($f['site'] ?? '', 200);
if (preg_match('/^@[A-Za-z0-9._]{2,60}$/', $site)) {
    // kept as typed
} else {
    $u = preg_match('#^[a-z][a-z0-9+.-]*://#i', $site) ? $site : 'https://' . $site;
    $p = parse_url($u);
    $h = strtolower($p['host'] ?? '');
    if (!$p || !in_array($p['scheme'] ?? '', ['http', 'https'], true) || isset($p['user']) || isset($p['pass']) || isset($p['port'])
        || strpos($h, '.') === false || preg_match('/^[\d.]+$/', $h) || strpos($h, ':') !== false || $h === 'localhost'
        || substr($h, -6) === '.local' || substr($h, -9) === '.internal') out(400, ['error' => 'check the website']);
    $site = 'https://' . $h . rtrim($p['path'] ?? '', '/');
}

$cnpjRaw = $clip($f['cnpj'] ?? '', 30);
$cnpj = preg_replace('/[.\/\-\s]/', '', $cnpjRaw);
if ($cnpj !== '' && !preg_match('/^\d{14}$/', $cnpj)) out(400, ['error' => 'check the CNPJ']);

$name = $clip($f['name'] ?? '', 120);
$service = $clip($f['service'] ?? '', 160);
$lang = ($f['lang'] ?? '') === 'en' ? 'en' : 'pt';

// the data lives next to public_html, not inside it
$dir = dirname(__DIR__) . '/mml-data';
if (!is_dir($dir)) @mkdir($dir, 0700, true);
$file = $dir . '/intake.jsonl';
$rows = is_file($file) ? file($file, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) : [];
$recent = 0; $seen = false;
foreach (array_slice($rows, -200) as $line) {
    $r = json_decode($line, true);
    if (!is_array($r)) continue;
    if (strtotime($r['at'] ?? '') > time() - 3600) $recent++;
    if (($r['email'] ?? '') === $email && ($r['site'] ?? '') === $site) $seen = true;
}
if ($recent >= MAX_PER_HOUR) out(429, ['error' => 'too many requests']);
if ($seen) out(200, ['ok' => true]); // the same request again is kept once

$row = ['at' => gmdate('c'), 'name' => $name, 'email' => $email, 'site' => $site, 'cnpj' => $cnpj, 'service' => $service, 'lang' => $lang];
file_put_contents($file, json_encode($row, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);

$lines = ['Novo pedido pelo site.', '', "Site ou rede social: $site", "E-mail: $email", 'Nome: ' . ($name ?: '(não informado)'),
          'CNPJ: ' . ($cnpj ?: '(não informado)'), 'O que vende e para quem: ' . ($service ?: '(não informado)'), "Idioma: $lang"];
$subject = '=?UTF-8?B?' . base64_encode('MineMyLead: pedido (' . ($name ?: $email) . ')') . '?=';
$headers = "From: MineMyLead <" . FROM . ">\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8\r\n";
$sent = @mail(TO, $subject, implode("\n", $lines), $headers);
if (!$sent) { file_put_contents($dir . '/mail-errors.log', gmdate('c') . " mail() failed for $email\n", FILE_APPEND | LOCK_EX); }
out(200, ['ok' => true]); // the request is kept either way
