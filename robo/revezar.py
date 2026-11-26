"""Revezamento: cada rodada do robô agenda a próxima.

O agendador do GitHub (on: schedule) não disparou nenhuma vez neste repositório
(26/11/2026): repositórios novos ficam no fim da fila e as rodadas atrasam horas
ou nem acontecem. Então, no fim de cada rodada, este script:

  1. espera até o próximo horário de coleta (:02, :17, :32, :47 — 2 min depois
     de o GDELT publicar o arquivo de 15 min);
  2. confere se há outra rodada mais nova do robô em andamento ou na fila
     (se houver, ela é quem vai passar o bastão — assim nunca ficam dois revezamentos);
  3. dispara a próxima rodada (workflow_dispatch com revezamento=sim).

Para parar o revezamento: cancele a rodada em andamento na aba Actions
(rodada cancelada não passa o bastão) ou desative o workflow.
Ele volta sozinho com qualquer push, rodada manual ou rodada agendada.

Precisa de GITHUB_TOKEN (com actions: write), GITHUB_REPOSITORY e GITHUB_RUN_ID.
"""
import datetime as dt
import json
import os
import sys
import time
import urllib.request

MINUTOS = (2, 17, 32, 47)
WORKFLOW = "atualizar.yml"
ATIVOS = ("queued", "in_progress", "waiting", "pending", "requested")


def api(caminho, metodo="GET", corpo=None):
    req = urllib.request.Request(
        f"https://api.github.com/repos/{os.environ['GITHUB_REPOSITORY']}/{caminho}",
        method=metodo,
        data=json.dumps(corpo).encode() if corpo is not None else None,
        headers={
            "Authorization": f"Bearer {os.environ['GITHUB_TOKEN']}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        txt = r.read()
        return json.loads(txt) if txt else None


def proximo_horario(agora):
    """Próximo :02/:17/:32/:47 com pelo menos 20 s de folga."""
    base = agora.replace(second=0, microsecond=0)
    for passo in range(0, 61):
        t = base + dt.timedelta(minutes=passo)
        if t.minute in MINUTOS and (t - agora).total_seconds() >= 20:
            return t
    return agora + dt.timedelta(minutes=15)


def outras_mais_novas(meu_id):
    achadas = []
    for status in ATIVOS:
        r = api(f"actions/workflows/{WORKFLOW}/runs?status={status}&per_page=20")
        for run in r.get("workflow_runs", []):
            if run["id"] > meu_id:
                achadas.append((run["id"], run["event"], run["status"]))
    return achadas


def main():
    meu_id = int(os.environ["GITHUB_RUN_ID"])
    agora = dt.datetime.now(dt.timezone.utc)
    alvo = proximo_horario(agora)
    espera = (alvo - agora).total_seconds()
    print(f"Próxima coleta às {alvo:%H:%M} UTC; esperando {espera / 60:.1f} min.", flush=True)
    time.sleep(espera)

    try:
        novas = outras_mais_novas(meu_id)
    except Exception as e:  # na dúvida, passa o bastão (o pior caso é uma coleta a mais)
        print(f"Não consegui conferir as outras rodadas ({e}); sigo com o revezamento.")
        novas = []
    if novas:
        print(f"Já há rodada mais nova do robô {novas[:3]}: ela passa o bastão. Fim.")
        return

    api(f"actions/workflows/{WORKFLOW}/dispatches", "POST",
        {"ref": "main", "inputs": {"revezamento": "sim"}})
    print("Próxima rodada disparada.")


if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Falha no revezamento: {e}", file=sys.stderr)
        sys.exit(1)
