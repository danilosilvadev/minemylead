<?php
// The form of the site (assets/contact.js posts here, same origin). It checks the data, keeps every request in a file OUTSIDE public_html
// (../mml-data/intake.jsonl) and emails contact@minemylead.com. Nothing is ever sent to the visitor from here.
declare(strict_types=1);

const TO = 'contact@minemylead.com';   // who gets the email
const FROM = 'contact@minemylead.com'; // a mailbox of this domain, so Hostinger's mail accepts it
const MAX_PER_HOUR = 40;

/** Sends one plain-text message through an SMTP server over SSL (port 465) with AUTH LOGIN. True when the server accepted it; $err says which step failed (never the login). */
function smtp_send(string $host, int $port, string $user, string $pass, string $from, string $to, string $replyTo, string $subject, string $body, string &$err): bool {
    $fp = @stream_socket_client("ssl://$host:$port", $errno, $errstr, 15);
    if (!$fp) { $err = " smtp connect failed: $errstr"; return false; }
    stream_set_timeout($fp, 15);
    $read = static function () use ($fp): string {
        $all = '';
        while (($l = fgets($fp, 515)) !== false) { $all .= $l; if (strlen($l) < 4 || $l[3] === ' ') break; }
        return $all;
    };
    $step = static function (string $line, string $want, string $label) use ($fp, $read, &$err): bool {
        fwrite($fp, $line . "\r\n");
        $r = $read();
        if (strpos($r, $want) !== 0) { $err = " smtp $label refused: " . trim(substr($r, 0, 160)); return false; }
        return true;
    };
    if (strpos($read(), '220') !== 0) { fclose($fp); $err = ' smtp: no greeting'; return false; }
    $ok = $step('EHLO minemylead.com', '250', 'EHLO') && $step('AUTH LOGIN', '334', 'AUTH') && $step(base64_encode($user), '334', 'user') && $step(base64_encode($pass), '235', 'login')
        && $step("MAIL FROM:<$from>", '250', 'MAIL FROM') && $step("RCPT TO:<$to>", '250', 'RCPT TO') && $step('DATA', '354', 'DATA');
    if ($ok) {
        $msg = "From: MineMyLead <$from>\r\nTo: <$to>\r\nReply-To: <$replyTo>\r\nSubject: $subject\r\nDate: " . date('r') . "\r\nMessage-ID: <" . bin2hex(random_bytes(8)) . "@minemylead.com>\r\n"
            . "MIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\nContent-Transfer-Encoding: base64\r\n\r\n" . chunk_split(base64_encode($body));
        $ok = $step($msg . "\r\n.", '250', 'message');
    }
    @fwrite($fp, "QUIT\r\n");
    fclose($fp);
    return $ok;
}

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

$wa = preg_replace('/[^\d+]/', '', $clip($f['whatsapp'] ?? '', 30));
if (!preg_match('/^\+?\d{10,14}$/', $wa)) out(400, ['error' => 'check the WhatsApp number']);

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

$row = ['at' => gmdate('c'), 'name' => $name, 'email' => $email, 'whatsapp' => $wa, 'site' => $site, 'cnpj' => $cnpj, 'service' => $service, 'lang' => $lang];
file_put_contents($file, json_encode($row, JSON_UNESCAPED_UNICODE) . "\n", FILE_APPEND | LOCK_EX);

$lines = ['Novo pedido pelo site.', '', "Site ou rede social: $site", "E-mail: $email", "WhatsApp: $wa", 'Nome: ' . ($name ?: '(não informado)'),
          'CNPJ: ' . ($cnpj ?: '(não informado)'), 'O que vende e para quem: ' . ($service ?: '(não informado)'), "Idioma: $lang"];
$subject = '=?UTF-8?B?' . base64_encode('MineMyLead: pedido (' . ($name ?: $email) . ')') . '?=';
$body = implode("\n", $lines);
$err = '';
$sent = false;
// 1) the mailbox's own SMTP login (mml-data/smtp.php returns ['user' => ..., 'pass' => ...]); mail sent this way is authenticated and lands in the inbox
$cfgFile = $dir . '/smtp.php';
$cfg = is_file($cfgFile) ? include $cfgFile : null;
if (is_array($cfg) && !empty($cfg['user']) && !empty($cfg['pass']) && $cfg['pass'] !== 'PUT_THE_PASSWORD_HERE') {
    $sent = smtp_send($cfg['host'] ?? 'smtp.hostinger.com', (int) ($cfg['port'] ?? 465), $cfg['user'], $cfg['pass'], FROM, TO, $email, $subject, $body, $err);
}
// 2) otherwise (or when SMTP failed) PHP's mail(), which Hostinger often delivers to spam or drops
if (!$sent) {
    // sent as the site's own host (the address the server really sends from), so the receiving mail server does not see a forged minemylead.com sender; the visitor is the Reply-To
    $host = preg_replace('/^www\./', '', strtolower((string) ($_SERVER['HTTP_HOST'] ?? 'localhost')));
    $sender = 'forms@' . $host;
    $headers = "From: MineMyLead <$sender>\r\nReply-To: $email\r\nContent-Type: text/plain; charset=UTF-8\r\n";
    $sent = @mail(TO, $subject, $body, $headers, '-f' . $sender);
    if (!$sent) $err .= ' mail() failed';
}
if ($err !== '') { file_put_contents($dir . '/mail-errors.log', gmdate('c') . " for $email:$err\n", FILE_APPEND | LOCK_EX); }
out(200, ['ok' => true]); // the request is kept either way
