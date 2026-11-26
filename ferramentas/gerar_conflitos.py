#!/usr/bin/env python3
"""Gera site/data/conflitos.json (lente Conflitos): a classificação curada, revista toda semana.

Edite a lista abaixo (proposta pelo Claude a partir de UCDP, ACLED e Crisis Group, aprovada pelo Kauê)
e rode: python3 ferramentas/gerar_conflitos.py
"""
import json
C = []
def c(id_, tipo, nome_pt, nome_en, partes_pt, partes_en, desde, sit_pt, sit_en, paises, mortos=None):
    d = {"id": id_, "tipo": tipo, "nome_pt": nome_pt, "nome_en": nome_en, "partes_pt": partes_pt, "partes_en": partes_en,
         "desde": desde, "situacao_pt": sit_pt, "situacao_en": sit_en, "paises": paises}
    if mortos: d["mortos_2026"] = mortos
    C.append(d)
# guerras (1.000+ mortes em 2026)
c("russia-ucrania","guerra","Guerra Rússia × Ucrânia","Russia–Ukraine war","Rússia × Ucrânia","Russia vs Ukraine","2022",
  "Combate ativo; as conversas de novembro só chegaram a um acordo de princípio sobre troca de prisioneiros.","Active fighting; November talks only reached agreement in principle on prisoner exchanges.",
  {"UA":"guerra","RU":"fora"}, 70675)
c("ira-eua-israel","guerra","Guerra do Irã","Iran war","Irã × EUA e Israel","Iran vs the US and Israel","2026-02",
  "Começou com ataques dos EUA e de Israel ao Irã; o Irã revidou na região e travou o Estreito de Ormuz. Ataques em terra e a petroleiros voltaram em meados de novembro.",
  "Began with US and Israeli strikes on Iran; Iran retaliated across the region and disrupted the Strait of Hormuz. Strikes on land and on tankers resumed in mid-November.",
  {"IR":"guerra","US":"fora","IL":"fora","KW":"atingido","BH":"atingido","JO":"atingido"}, 3859)
c("iemen","guerra","Guerra no Iêmen","Yemen war","Houthis × governo do Iêmen e Arábia Saudita","Houthis vs Yemen's government and Saudi Arabia","2014 (retomada em jul/2026)",
  "A luta voltou em julho de 2026; os houthis tomaram a costa do Mar Vermelho e atacam a Arábia Saudita quase todo dia.","Fighting resumed in July 2026; the Houthis took the Red Sea coast and strike Saudi Arabia almost daily.",
  {"YE":"guerra","SA":"fora"}, 6504)
c("sudao","guerra","Guerra civil no Sudão","Sudanese civil war","Exército × RSF","Army vs RSF","2023",
  "O exército retomou terreno em Kordofan; uma missão da ONU viu genocídio nas atrocidades da RSF em El Fasher.","The army regained ground in Kordofan; a UN mission found the RSF's El Fasher atrocities amount to genocide.", {"SD":"guerra"}, 3977)
c("somalia","guerra","Somália × al-Shabaab","Somalia vs al-Shabaab","Governo × al-Shabaab","Government vs al-Shabaab","2006","Insurgência ativa, com crise política.","Active insurgency amid a political crisis.", {"SO":"guerra"}, 3069)
c("paquistao-ttp","guerra","Paquistão × Talibã paquistanês","Pakistan vs Pakistani Taliban","Governo × TTP","Government vs TTP","2007","Insurgência em Khyber Pakhtunkhwa.","Insurgency in Khyber Pakhtunkhwa.", {"PK":"guerra"}, 2357)
c("paquistao-baloch","guerra","Paquistão × separatistas balúchis","Pakistan vs Baloch insurgents","Governo × separatistas balúchis","Government vs Baloch separatists","2004","Violência no Baluchistão subiu muito em 2026.","Violence in Balochistan rose sharply in 2026.", {"PK":"guerra"}, 1572)
c("etiopia-fano","guerra","Etiópia × milícias Fano","Ethiopia vs Fano militias","Governo × Fano (Amhara)","Government vs Fano (Amhara)","2023","Combate ativo em Amhara.","Active fighting in Amhara.", {"ET":"guerra"}, 2116)
c("etiopia-tigre","guerra","Guerra no Tigré","Tigray war","Governo × TPLF e aliados","Government vs TPLF and allies","2020 (retomada em ago/2026)","Retomada em agosto de 2026; o governo tomou Mekelle em outubro.","Resumed in August 2026; government forces took Mekelle in October.", {"ET":"guerra"}, 1040)
c("nigeria-ei","guerra","Nigéria × Estado Islâmico","Nigeria vs Islamic State","Governo × Boko Haram e ISWAP","Government vs Boko Haram and ISWAP","2009","Combate no nordeste.","Fighting in the north-east.", {"NG":"guerra"}, 2033)
c("nigeria-noroeste","guerra","Nigéria: grupos armados no noroeste","Nigeria: armed bands in the north-west","Governo × grupos armados","Government vs armed bands","2011","Sequestros em massa e ataques a vilarejos.","Mass kidnappings and village raids.", {"NG":"guerra"}, 1909)
c("burkina-jnim","guerra","Burkina Faso × JNIM","Burkina Faso vs JNIM","Governo × JNIM e Estado Islâmico","Government vs JNIM and Islamic State","2015","O país mais atingido do Sahel.","The worst-affected Sahel state.", {"BF":"guerra"}, 1810)
c("mali-jnim","guerra","Mali × JNIM","Mali vs JNIM","Governo × JNIM e Frente de Libertação do Azawad","Government vs JNIM and the Azawad Liberation Front","2012","O JNIM declarou bloqueio a Bamako em abril.","JNIM declared a blockade of Bamako in April.", {"ML":"guerra"}, 1007)
c("congo-m23","guerra","Guerra no leste do Congo","Eastern Congo war","Exército e milícias × M23/AFC (apoiado por Ruanda)","Army and militias vs M23/AFC (backed by Rwanda)","2021","Combates continuam no Kivu apesar dos acordos de Doha e Washington.","Fighting continues in Kivu despite the Doha and Washington agreements.", {"CD":"guerra"})
c("mianmar","guerra","Guerra civil em Mianmar","Myanmar civil war","Junta militar × resistência e grupos étnicos armados","Military junta vs resistance and ethnic armed groups","2021","Guerra civil em todo o país desde o golpe.","Nationwide civil war since the coup.", {"MM":"guerra"})
# conflitos armados
c("israel-hezbollah","conflito","Israel × Hezbollah (Líbano)","Israel vs Hezbollah (Lebanon)","Israel × Hezbollah","Israel vs Hezbollah","2023 (retomada em mar/2026)","Foi guerra este ano; trégua no papel desde abril, com ataques israelenses contínuos.","War-level this year; nominal truce since April, with continued Israeli strikes.", {"LB":"conflito","IL":"fora"}, 4597)
c("israel-gaza","conflito","Israel × Hamas (Gaza)","Israel vs Hamas (Gaza)","Israel × Hamas e grupos aliados","Israel vs Hamas and allied groups","2023","Cessar-fogo desde out/2025, com operação terrestre israelense anunciada em 18/11.","Ceasefire since Oct 2025, with an Israeli ground operation announced on 18 Nov.", {"PS":"conflito","IL":"fora"}, 1302)
c("siria","conflito","Conflitos na Síria","Conflicts in Syria","Governo de transição × Estado Islâmico, grupos locais; posições israelenses","Transitional government vs Islamic State and local groups; Israeli positions","2011","Vários conflitos menores depois de Assad.","Several smaller conflicts after Assad.", {"SY":"conflito"})
c("iraque","conflito","Iraque","Iraq","Forças iraquianas × forças dos EUA e de Israel (registro preliminar)","Iraqi forces vs US and Israeli forces (provisional coding)","2026","Conflito novo ligado à guerra do Irã.","New conflict linked to the Iran war.", {"IQ":"conflito"})
c("paquistao-afeganistao","conflito","Paquistão × Afeganistão","Pakistan vs Afghanistan","Paquistão × governo talibã","Pakistan vs the Taliban government","2025","Trocas de ataques na fronteira desde fevereiro.","Cross-border strikes since February.", {"AF":"conflito","PK":"guerra"})
c("afeganistao-interno","conflito","Afeganistão interno","Afghanistan (internal)","Talibã × Estado Islâmico-K e Frente de Resistência","Taliban vs Islamic State-K and the Resistance Front","2021","Insurgências de menor escala.","Smaller-scale insurgencies.", {"AF":"conflito"})
c("india","conflito","Índia: maoístas e Caxemira","India: Maoists and Kashmir","Forças indianas × insurgentes maoístas; tensão com o Paquistão na Caxemira","Indian forces vs Maoist insurgents; tension with Pakistan in Kashmir","1967","Insurgência no centro e leste; Caxemira em alerta.","Insurgency in the centre and east; Kashmir on alert.", {"IN":"conflito"})
for id_, pais, npt, nen, ppt, pen, desde in [
    ("sudao-do-sul","SS","Sudão do Sul","South Sudan","Governo × SPLA-IO","Government vs SPLA-IO","2013"),
    ("rca","CF","República Centro-Africana","Central African Republic","Governo e forças russas × rebeldes","Government and Russian forces vs rebels","2012"),
    ("niger","NE","Níger","Niger","Exército × Estado Islâmico Sahel, JNIM e Boko Haram","Army vs Islamic State Sahel, JNIM and Boko Haram","2015"),
    ("camaroes","CM","Camarões (regiões anglófonas)","Cameroon (Anglophone regions)","Exército × separatistas anglófonos","Army vs Anglophone separatists","2017"),
    ("mocambique","MZ","Moçambique (Cabo Delgado)","Mozambique (Cabo Delgado)","Forças de Moçambique e Ruanda × Estado Islâmico","Mozambican and Rwandan forces vs Islamic State","2017"),
    ("tailandia-sul","TH","Tailândia (sul)","Thailand (Deep South)","Forças tailandesas × insurgentes malaio-muçulmanos","Thai forces vs Malay-Muslim insurgents","2004"),
    ("filipinas","PH","Filipinas","Philippines","Forças Armadas × Novo Exército do Povo e grupos islamistas","Armed forces vs New People's Army and Islamist groups","1969"),
    ("papua","ID","Indonésia (Papua)","Indonesia (Papua)","Forças indonésias × Exército de Libertação de Papua Ocidental","Indonesian forces vs West Papua National Liberation Army","1965"),
    ("mexico","MX","México: cartéis","Mexico: cartels","Cartéis entre si e contra as forças de segurança","Cartels against each other and the security forces","2006"),
    ("haiti","HT","Haiti: gangues","Haiti: gangs","Polícia e missão internacional × coalizão de gangues Viv Ansanm","Police and international mission vs the Viv Ansanm gang coalition","2021"),
    ("colombia","CO","Colômbia","Colombia","Forças Armadas × ELN, dissidências das FARC e Clan del Golfo","Armed forces vs ELN, FARC dissidents and Clan del Golfo","1964"),
    ("equador","EC","Equador","Ecuador","Forças Armadas × crime organizado","Armed forces vs organised crime","2024")]:
    c(id_, "conflito", npt, nen, ppt, pen, desde, "Combate armado abaixo do nível de guerra.", "Armed fighting below war level.", {pais: "conflito"})
c("benin-togo","conflito","Benin e Togo (norte)","Benin and Togo (north)","Exércitos × JNIM","Armies vs JNIM","2021","O conflito do Sahel chegando ao litoral.","The Sahel conflict reaching the coast.", {"BJ":"conflito","TG":"conflito"})
# tensões
c("china-taiwan","tensao","China × Taiwan","China–Taiwan","China × Taiwan","China vs Taiwan","2022","Pressão militar sem combate.","Military pressure without fighting.", {"CN":"tensao","TW":"tensao"})
c("russia-otan","tensao","Rússia × OTAN (flanco leste)","Russia–NATO (eastern flank)","Rússia × Polônia e Bálticos","Russia vs Poland and the Baltics","2022","Ameaças e incidentes, sem combate.","Threats and incidents, no fighting.", {"PL":"tensao","LT":"tensao","LV":"tensao","EE":"tensao"})
c("etiopia-eritreia","tensao","Etiópia × Eritreia","Ethiopia–Eritrea","Etiópia × Eritreia","Ethiopia vs Eritrea","2025","Ruptura diplomática e tensão na fronteira.","Diplomatic rupture and border tension.", {"ER":"tensao"})
c("eua-venezuela","tensao","EUA × Venezuela","US–Venezuela","EUA × Venezuela","US vs Venezuela","2026","Operação americana em janeiro, encerrada no dia seguinte.","A US operation in January, over the next day.", {"VE":"tensao"})
c("tailandia-camboja","tensao","Tailândia × Camboja","Thailand–Cambodia","Tailândia × Camboja","Thailand vs Cambodia","2025","Combates na fronteira terminaram com cessar-fogo.","Border fighting ended in a ceasefire.", {"KH":"tensao"})
# palavras (em inglês, como nos títulos traduzidos) que ligam uma notícia ao conflito
NOMES = {
 "russia-ucrania": ["Ukraine", "Ukrainian", "Kyiv", "Kiev", "Donbas", "Donetsk", "Zaporizhzhia", "Kharkiv", "Kherson", "Zelensky", "Zelenskyy"],
 "ira-eua-israel": ["Iran", "Iranian", "Tehran", "Hormuz", "IRGC"],
 "iemen": ["Yemen", "Yemeni", "Houthi", "Houthis", "Aden", "Sanaa", "Mocha"],
 "sudao": ["Sudan", "Sudanese", "RSF", "El Fasher", "Khartoum", "Darfur", "Kordofan"],
 "somalia": ["Somalia", "Somali", "al-Shabaab", "Al-Shabaab", "Mogadishu"],
 "paquistao-ttp": ["TTP", "Pakistani Taliban", "Khyber Pakhtunkhwa"],
 "paquistao-baloch": ["Balochistan", "Baloch"],
 "etiopia-fano": ["Fano", "Amhara"],
 "etiopia-tigre": ["Tigray", "TPLF", "Mekelle"],
 "nigeria-ei": ["Boko Haram", "ISWAP", "Borno"],
 "nigeria-noroeste": ["Zamfara", "Katsina", "Sokoto", "bandits"],
 "burkina-jnim": ["Burkina Faso", "Burkinabe"],
 "mali-jnim": ["Mali", "Malian", "Bamako", "JNIM"],
 "congo-m23": ["M23", "Goma", "Kivu", "Bukavu"],
 "mianmar": ["Myanmar", "Burma", "Burmese"],
 "israel-hezbollah": ["Hezbollah", "Lebanon", "Lebanese", "Beirut"],
 "israel-gaza": ["Gaza", "Hamas", "West Bank", "Palestinian", "Palestinians"],
 "siria": ["Syria", "Syrian", "Damascus", "Suwayda", "Sweida"],
 "iraque": ["Iraq", "Iraqi", "Baghdad"],
 "paquistao-afeganistao": ["Afghanistan", "Afghan", "Torkham", "Kabul"],
 "afeganistao-interno": ["ISIS-K", "ISKP", "Afghanistan"],
 "india": ["Maoist", "Maoists", "Naxal", "Kashmir"],
 "sudao-do-sul": ["South Sudan"],
 "rca": ["Central African Republic"],
 "niger": ["Niger", "Nigerien", "Niamey"],
 "camaroes": ["Cameroon", "Ambazonia"],
 "mocambique": ["Mozambique", "Cabo Delgado"],
 "tailandia-sul": ["Pattani", "Narathiwat"],
 "filipinas": ["Philippines", "Mindanao", "New People's Army"],
 "papua": ["Papua"],
 "mexico": ["cartel", "cartels", "Cartel", "Sinaloa", "Jalisco", "CJNG"],
 "haiti": ["Haiti", "Haitian", "Port-au-Prince"],
 "colombia": ["ELN", "FARC", "Clan del Golfo", "Colombia", "Colombian"],
 "equador": ["Ecuador", "Ecuadorian"],
 "benin-togo": ["Benin", "Togo"],
 "china-taiwan": ["Taiwan", "Taiwanese", "Taipei"],
 "russia-otan": ["NATO", "Baltic", "Baltics", "Poland", "Lithuania", "Latvia", "Estonia"],
 "etiopia-eritreia": ["Eritrea", "Eritrean"],
 "eua-venezuela": ["Venezuela", "Venezuelan", "Maduro"],
 "tailandia-camboja": ["Cambodia", "Cambodian"],
}
AREA = {"russia-ucrania": "ucrania"}  # área hachurada ligada ao conflito (areas.json)
for x in C:
    x["nomes"] = NOMES.get(x["id"], [])
    if x["id"] in AREA: x["area"] = AREA[x["id"]]
ordem = {"guerra":5, "fora":4, "conflito":3, "atingido":2, "tensao":1}
paises = {}
for x in C:
    for k, sit in x["paises"].items():
        p = paises.setdefault(k, {"situacao": sit, "conflitos": []})
        if ordem[sit] > ordem[p["situacao"]]: p["situacao"] = sit
        p["conflitos"].append(x["id"])
saida = {"_comentario": "Classificação de conflitos do Raccoon Mundi (lente Conflitos). Curada: proposta pelo Claude a partir de UCDP, ACLED e Crisis Group e aprovada pelo Kauê; revista toda semana. Situação do país: guerra (no território, 1.000+ mortes no ano), fora (luta fora do território, mesmo recebendo ataques em casa), conflito (combate abaixo disso ou guerra em cessar-fogo frágil), atingido (terceiro atingido, ex.: bases dos EUA no Golfo), tensao (ameaça militar sem combate). Mortes em 2026: até 31/10, levantamento do Blackwing a partir de UCDP e ACLED.",
         "atualizado": "2026-11-25", "conflitos": C, "paises": dict(sorted(paises.items()))}
json.dump(saida, open("site/data/conflitos.json","w",encoding="utf-8"), ensure_ascii=False, indent=1)
from collections import Counter
print(len(C), "conflitos;", Counter(p["situacao"] for p in paises.values()))
