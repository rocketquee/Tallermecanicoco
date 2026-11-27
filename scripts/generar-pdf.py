# -*- coding: utf-8 -*-
"""Genera docs/reporte-final.pdf a partir de docs/reporte-practica.md.

Diseño formal con ReportLab: portada, autores, índice con números de página,
texto justificado, tablas con bordes y numeración de páginas.

Uso:
    python scripts/generar-pdf.py
    python scripts/generar-pdf.py --sin-capturas      (omite el capítulo 6)
    python scripts/generar-pdf.py --entrada docs/otro.md --salida docs/otro.pdf
"""

from __future__ import annotations

import argparse
import re
import sys
import tempfile
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT, TA_RIGHT
from reportlab.lib.fonts import addMapping
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    HRFlowable,
    LongTable,
    NextPageTemplate,
    PageBreak,
    PageTemplate,
    Paragraph,
    Preformatted,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.platypus.tableofcontents import TableOfContents

RAIZ = Path(__file__).resolve().parents[1]
ENTRADA = RAIZ / "docs" / "reporte-practica.md"
SALIDA = RAIZ / "docs" / "reporte-final.pdf"

AUTORES = [
    "Juan Pablo García Padilla",
    "Jorge Luis Monsivais Rodriguez",
    "Mario Alberto Rivas Escobar",
    "Jonnatan Martinez Aquino",
]

AZUL = colors.HexColor("#1b2a41")
AZUL_CLARO = colors.HexColor("#2f4a6d")
ORO = colors.HexColor("#9a7b2f")
GRIS = colors.HexColor("#5b6675")
TINTA = colors.HexColor("#1c2430")
LINEA = colors.HexColor("#c8d0da")
FONDO_TABLA = colors.HexColor("#eef2f7")
FONDO_CODIGO = colors.HexColor("#f6f7f9")
FONDO_CITA = colors.HexColor("#fbf8ef")

ANCHO_UTIL = 166 * mm


# ---------------------------------------------------------------------------
# Fuentes
# ---------------------------------------------------------------------------
def registrar_fuentes() -> None:
    fuentes = {
        "Times": ("times.ttf", "timesbd.ttf", "timesi.ttf", "timesbi.ttf"),
        "Arial": ("arial.ttf", "arialbd.ttf", "ariali.ttf", "arialbi.ttf"),
        "Courier": ("cour.ttf", "courbd.ttf", "couri.ttf", "courbi.ttf"),
    }
    carpeta = Path(r"C:\Windows\Fonts")
    for familia, (normal, negrita, cursiva, negrita_cursiva) in fuentes.items():
        rutas = [carpeta / normal, carpeta / negrita, carpeta / cursiva, carpeta / negrita_cursiva]
        if not all(r.exists() for r in rutas):
            continue
        pdfmetrics.registerFont(TTFont(familia, str(rutas[0])))
        pdfmetrics.registerFont(TTFont(f"{familia}-Bold", str(rutas[1])))
        pdfmetrics.registerFont(TTFont(f"{familia}-Italic", str(rutas[2])))
        pdfmetrics.registerFont(TTFont(f"{familia}-BoldItalic", str(rutas[3])))
        addMapping(familia, 0, 0, familia)
        addMapping(familia, 1, 0, f"{familia}-Bold")
        addMapping(familia, 0, 1, f"{familia}-Italic")
        addMapping(familia, 1, 1, f"{familia}-BoldItalic")


registrar_fuentes()

SERIF = "Times" if "Times" in pdfmetrics.getRegisteredFontNames() else "Times-Roman"
SANS = "Arial" if "Arial" in pdfmetrics.getRegisteredFontNames() else "Helvetica"
MONO = "Courier" if "Courier" in pdfmetrics.getRegisteredFontNames() else "Courier"

SERIF_BOLD = f"{SERIF}-Bold" if SERIF == "Times" else "Times-Bold"
SANS_BOLD = f"{SANS}-Bold" if SANS == "Arial" else "Helvetica-Bold"


def _glifo(caracter: str) -> bool:
    try:
        return ord(caracter) in pdfmetrics.getFont(SERIF).face.charToGlyph
    except Exception:
        return False


CASILLA = next((c for c in ("\u2610", "\u25a1", "\u25fb", "\u2022") if _glifo(c)), "\u2022")


# ---------------------------------------------------------------------------
# Estilos
# ---------------------------------------------------------------------------
E = {}
E["cuerpo"] = ParagraphStyle(
    "cuerpo", fontName=SERIF, fontSize=10.6, leading=15.4, alignment=TA_JUSTIFY,
    textColor=TINTA, spaceAfter=5.2, hyphenationLang="es_MX",
)
E["H2"] = ParagraphStyle(
    "H2", fontName=SANS, fontSize=16.5, leading=20, textColor=AZUL,
    spaceBefore=0, spaceAfter=2, alignment=TA_LEFT,
)
E["H3"] = ParagraphStyle(
    "H3", fontName=SANS, fontSize=11.6, leading=14.5, textColor=AZUL_CLARO,
    spaceBefore=11, spaceAfter=3.5, keepWithNext=1,
)
E["H4"] = ParagraphStyle(
    "H4", fontName=SERIF_BOLD, fontSize=10.8, leading=14, textColor=AZUL_CLARO,
    spaceBefore=8, spaceAfter=3, keepWithNext=1,
)
E["lista"] = ParagraphStyle(
    "lista", parent=E["cuerpo"], leftIndent=13, bulletIndent=1,
    spaceAfter=2.6, bulletFontName=SERIF, bulletFontSize=10.6,
)
E["cita"] = ParagraphStyle(
    "cita", parent=E["cuerpo"], fontSize=9.9, leading=14.2, textColor=colors.HexColor("#3a4553"),
)
E["codigo"] = ParagraphStyle(
    "codigo", fontName=MONO, fontSize=7.5, leading=9.6, textColor=TINTA,
    leftIndent=11, rightIndent=4,
)
E["celda"] = ParagraphStyle(
    "celda", fontName=SANS, fontSize=8.1, leading=10.4, textColor=TINTA,
)
E["celda_c"] = ParagraphStyle("celda_c", parent=E["celda"], alignment=TA_CENTER)
E["celda_r"] = ParagraphStyle("celda_r", parent=E["celda"], alignment=TA_RIGHT)
E["cabecera"] = ParagraphStyle(
    "cabecera", fontName=SANS_BOLD,
    fontSize=8.1, leading=10.4, textColor=AZUL,
)
E["cabecera_c"] = ParagraphStyle("cabecera_c", parent=E["cabecera"], alignment=TA_CENTER)
E["cabecera_r"] = ParagraphStyle("cabecera_r", parent=E["cabecera"], alignment=TA_RIGHT)

E["titulo_portada"] = ParagraphStyle(
    "titulo_portada", fontName=SANS_BOLD,
    fontSize=38, leading=44, alignment=TA_CENTER, textColor=AZUL,
)
E["subtitulo"] = ParagraphStyle(
    "subtitulo", fontName=SANS, fontSize=13.2, leading=19, alignment=TA_CENTER,
    textColor=AZUL_CLARO,
)
E["tipo"] = ParagraphStyle(
    "tipo", fontName=SANS_BOLD,
    fontSize=10.4, leading=14, alignment=TA_CENTER, textColor=TINTA,
)
E["detalle"] = ParagraphStyle(
    "detalle", fontName=SERIF, fontSize=10.6, leading=14, alignment=TA_CENTER,
    textColor=GRIS,
)
E["etiqueta"] = ParagraphStyle(
    "etiqueta", fontName=SANS_BOLD,
    fontSize=7.8, leading=12, alignment=TA_CENTER, textColor=ORO,
)
E["autor"] = ParagraphStyle(
    "autor", fontName=SERIF, fontSize=10.8, leading=15, alignment=TA_CENTER, textColor=TINTA,
)
E["pie_portada"] = ParagraphStyle(
    "pie_portada", fontName=SANS, fontSize=8.4, leading=12, alignment=TA_CENTER, textColor=GRIS,
)
E["titulo_indice"] = ParagraphStyle(
    "titulo_indice", parent=E["H2"], spaceAfter=8,
)
E["toc0"] = ParagraphStyle(
    "toc0", fontName=SANS_BOLD,
    fontSize=10.2, leading=17, textColor=AZUL, spaceBefore=5,
)
E["toc1"] = ParagraphStyle(
    "toc1", fontName=SANS, fontSize=9.3, leading=14, textColor=GRIS,
    leftIndent=10, firstLineIndent=-2,
)


# ---------------------------------------------------------------------------
# Markdown -> marcado de ReportLab
# ---------------------------------------------------------------------------
def inline(texto: str, codigo: float = 9.2) -> str:
    t = texto.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    t = re.sub(
        r"`([^`]+)`",
        lambda m: f'<font face="{MONO}" size="{codigo}" color="#1b2a41">{m.group(1)}</font>',
        t,
    )
    t = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", t)
    t = re.sub(r"(?<!\*)\*([^*\n]+)\*(?!\*)", r"<i>\1</i>", t)
    return t


def ancho_mixto(texto: str, codigo: float = 8.0) -> float:
    """Ancho real de una celda, sumando cada tramo con la fuente que le toca."""
    total = 0.0
    for parte in re.split(r"(`[^`]+`)", texto):
        if not parte:
            continue
        if len(parte) > 1 and parte.startswith("`") and parte.endswith("`"):
            total += pdfmetrics.stringWidth(parte[1:-1], MONO, codigo)
        else:
            total += pdfmetrics.stringWidth(
                parte.replace("**", "").replace("*", ""), SANS, 8.1
            )
    return total


def texto_plano(markdown_texto: str) -> str:
    t = re.sub(r"`([^`]+)`", r"\1", markdown_texto)
    t = t.replace("**", "").replace("*", "")
    return t


# ---------------------------------------------------------------------------
# Parser de bloques
# ---------------------------------------------------------------------------
def es_inicio_de_bloque(linea: str) -> bool:
    s = linea.strip()
    return bool(
        re.match(r"^(#{1,4}\s|```|\||>|<!--|---$)", s)
        or re.match(r"^([-*+]|\d+[.)])\s", s)
    )


def bloques(texto: str):
    lineas = texto.split("\n")
    i = 0
    while i < len(lineas):
        cruda = lineas[i]
        s = cruda.strip()
        if not s:
            i += 1
            continue
        if s.startswith("<!--"):
            if "INDICE" in s:
                yield ("indice", None)
            elif "salto-de-pagina" in s:
                yield ("salto", None)
            i += 1
            continue
        if re.match(r"^-{3,}$", s):
            i += 1
            continue
        m = re.match(r"^(#{1,4})\s+(.*)$", s)
        if m:
            yield (f"h{len(m.group(1))}", m.group(2).strip())
            i += 1
            continue
        if s.startswith("```"):
            idioma = s[3:].strip()
            i += 1
            codigo = []
            while i < len(lineas) and not lineas[i].strip().startswith("```"):
                codigo.append(lineas[i])
                i += 1
            i += 1
            yield ("codigo", (idioma, codigo))
            continue
        if s.startswith(">"):
            partes = []
            while i < len(lineas) and lineas[i].strip().startswith(">"):
                partes.append(lineas[i].strip().lstrip(">").strip())
                i += 1
            yield ("cita", " ".join(partes))
            continue
        if s.startswith("|"):
            filas = []
            while i < len(lineas) and lineas[i].strip().startswith("|"):
                filas.append(lineas[i].strip())
                i += 1
            yield ("tabla", filas)
            continue
        m = re.match(r"^([-*+]|\d+[.)])\s+(.*)$", s)
        if m:
            items = []
            while i < len(lineas):
                mm_ = re.match(r"^([-*+]|\d+[.)])\s+(.*)$", lineas[i].strip())
                if mm_:
                    items.append([mm_.group(1), mm_.group(2).strip()])
                    i += 1
                elif (
                    lineas[i].strip()
                    and re.match(r"^(\s{2,}|\t)\S", lineas[i])
                    and not es_inicio_de_bloque(lineas[i])
                    and items
                ):
                    items[-1][1] += " " + lineas[i].strip()
                    i += 1
                elif not lineas[i].strip():
                    if (
                        i + 1 < len(lineas)
                        and re.match(r"^(\s{2,}|\t)\S", lineas[i + 1])
                        and not es_inicio_de_bloque(lineas[i + 1])
                    ):
                        i += 1
                        continue
                    break
                else:
                    break
            yield ("lista", items)
            continue

        parrafo = [s]
        i += 1
        while i < len(lineas):
            siguiente = lineas[i]
            if not siguiente.strip() or es_inicio_de_bloque(siguiente):
                break
            parrafo.append(siguiente.strip())
            i += 1
        yield ("parrafo", " ".join(parrafo))


# ---------------------------------------------------------------------------
# Tablas
# ---------------------------------------------------------------------------
def anchos_columnas(datos, disponible=ANCHO_UTIL):
    """Reparte el ancho midiendo el texto real, para que ningún dato se parta."""
    columnas = len(datos[0])
    deseado = []
    minimo = []
    for c in range(columnas):
        textos = [f[c] for f in datos if c < len(f)]
        medido = 0.0
        token = 0.0
        for texto in textos:
            medido = max(medido, ancho_mixto(texto))
            for palabra in re.split(r"\s+", texto):
                token = max(token, ancho_mixto(palabra))
        deseado.append(min(medido + 8, (0.45 if columnas <= 3 else 0.32) * disponible))
        minimo.append(min(token + 9, 0.45 * disponible))

    total = sum(deseado) or 1
    anchos = [disponible * d / total for d in deseado]

    for _ in range(8):
        deficit = sum(max(0.0, minimo[c] - anchos[c]) for c in range(columnas))
        if deficit < 0.5:
            break
        donantes = [c for c in range(columnas) if anchos[c] > minimo[c] + 0.5]
        holgura = sum(anchos[c] - minimo[c] for c in donantes)
        if holgura <= 0.5:
            break
        for c in range(columnas):
            if anchos[c] < minimo[c]:
                anchos[c] = minimo[c]
            elif c in donantes:
                anchos[c] -= min(
                    anchos[c] - minimo[c], deficit * (anchos[c] - minimo[c]) / holgura
                )

    factor = disponible / sum(anchos)
    return [a * factor for a in anchos]


def construir_tabla(filas, disponible=ANCHO_UTIL):
    cabecera = [c.strip() for c in filas[0].strip().strip("|").split("|")]
    alineaciones = ["left"] * len(cabecera)
    cuerpo = filas[1:]
    if len(filas) > 1 and re.match(r"^[\s|:\-]+$", filas[1]):
        alineaciones = []
        for c in filas[1].strip().strip("|").split("|"):
            c = c.strip()
            if c.startswith(":") and c.endswith(":"):
                alineaciones.append("center")
            elif c.endswith(":"):
                alineaciones.append("right")
            else:
                alineaciones.append("left")
        cuerpo = filas[2:]

    datos = []
    for fila in cuerpo:
        celdas = [c.strip() for c in fila.strip().strip("|").split("|")]
        if len(celdas) < len(cabecera):
            celdas += [""] * (len(cabecera) - len(celdas))
        datos.append(celdas[: len(cabecera)])
    if not datos:
        return None

    estilos = {"left": E["celda"], "center": E["celda_c"], "right": E["celda_r"]}
    estilos_cab = {
        "left": E["cabecera"], "center": E["cabecera_c"], "right": E["cabecera_r"],
    }

    tabla_datos = [
        [Paragraph(inline(t, codigo=8.0), estilos_cab[alineaciones[i]]) for i, t in enumerate(cabecera)]
    ]
    for fila in datos:
        tabla_datos.append(
            [Paragraph(inline(t, codigo=8.0), estilos[alineaciones[i]]) for i, t in enumerate(fila)]
        )

    anchos = anchos_columnas([cabecera] + datos, disponible)
    tabla = LongTable(
        tabla_datos, colWidths=anchos, repeatRows=1, hAlign="LEFT", splitByRow=1, splitInRow=0
    )
    estilos_tabla = [
        ("BACKGROUND", (0, 0), (-1, 0), FONDO_TABLA),
        ("GRID", (0, 0), (-1, -1), 0.5, LINEA),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 3.4),
        ("RIGHTPADDING", (0, 0), (-1, -1), 3.4),
        ("TOPPADDING", (0, 0), (-1, -1), 2.8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 2.8),
    ]
    for indice in range(1, len(tabla_datos)):
        if indice % 2 == 0:
            estilos_tabla.append(("BACKGROUND", (0, indice), (-1, indice), colors.HexColor("#fafbfc")))
    tabla.setStyle(TableStyle(estilos_tabla))
    return tabla


# ---------------------------------------------------------------------------
# Código con ajuste suave
# ---------------------------------------------------------------------------
def envolver(linea: str, ancho: int = 96):
    trozos = []
    while len(linea) > ancho:
        corte = linea.rfind(" ", 0, ancho)
        if corte < ancho // 2:
            corte = ancho
        trozos.append(linea[:corte].rstrip())
        linea = "    " + linea[corte:].lstrip()
    trozos.append(linea)
    return trozos


class BloqueCodigo(Preformatted):
    """Código con fondo y filete dorado, capaz de partirse entre páginas."""

    def split(self, availWidth, availHeight):
        if availHeight < self.style.leading * 2:
            return []
        caben = int(availHeight / self.style.leading)
        if caben >= len(self.lines):
            return []
        return [
            BloqueCodigo("\n".join(self.lines[:caben]), self.style),
            BloqueCodigo("\n".join(self.lines[caben:]), self.style),
        ]

    def draw(self):
        lienzo = self.canv
        lienzo.saveState()
        lienzo.setFillColor(FONDO_CODIGO)
        lienzo.rect(0, -4, self.width, self.height + 8, stroke=0, fill=1)
        lienzo.setFillColor(ORO)
        lienzo.rect(0, -4, 2.2, self.height + 8, stroke=0, fill=1)
        lienzo.restoreState()
        super().draw()


def construir_codigo(codigo):
    lineas = []
    for linea in codigo:
        lineas.extend(envolver(linea.rstrip()))
    texto = "\n".join(lineas) if lineas else " "
    return BloqueCodigo(texto, E["codigo"])


def construir_cita(texto):
    parrafo = Paragraph(inline(texto), E["cita"])
    marco = Table([[parrafo]], colWidths=[ANCHO_UTIL])
    marco.setStyle(
        TableStyle(
            [
                ("LINEBEFORE", (0, 0), (0, -1), 2.2, ORO),
                ("BACKGROUND", (0, 0), (-1, -1), FONDO_CITA),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )
    return marco


# ---------------------------------------------------------------------------
# Documento
# ---------------------------------------------------------------------------
class Informe(BaseDocTemplate):
    def __init__(self, ruta, total_paginas=None, **kw):
        super().__init__(str(ruta), pagesize=A4, **kw)
        self.total_paginas = total_paginas
        portada = Frame(30 * mm, 46 * mm, 150 * mm, 200 * mm, id="portada", showBoundary=0)
        cuerpo = Frame(22 * mm, 22 * mm, 166 * mm, 253 * mm, id="cuerpo", showBoundary=0)
        self.addPageTemplates(
            [
                PageTemplate(id="portada", frames=[portada], onPage=self.decorar_portada),
                PageTemplate(id="cuerpo", frames=[cuerpo], onPage=self.decorar_pagina),
            ]
        )

    # -- decoración ---------------------------------------------------------
    def decorar_portada(self, lienzo, doc):
        ancho, alto = A4
        lienzo.saveState()
        lienzo.setFillColor(AZUL)
        lienzo.rect(0, alto - 17 * mm, ancho, 17 * mm, stroke=0, fill=1)
        lienzo.setStrokeColor(colors.Color(0.60, 0.48, 0.18, alpha=0.55))
        lienzo.setLineWidth(0.8)
        lienzo.rect(18 * mm, 26 * mm, ancho - 36 * mm, alto - 52 * mm, stroke=1, fill=0)
        lienzo.setFillColor(GRIS)
        lienzo.setFont(SANS, 8.2)
        lienzo.drawCentredString(
            ancho / 2, 17 * mm, "Documento técnico · Pizarro Performance Garage · 2026"
        )
        lienzo.restoreState()

    def decorar_pagina(self, lienzo, doc):
        ancho, _ = A4
        lienzo.saveState()
        lienzo.setStrokeColor(ORO)
        lienzo.setLineWidth(0.5)
        lienzo.line(22 * mm, 16 * mm, ancho - 22 * mm, 16 * mm)
        lienzo.setFillColor(GRIS)
        lienzo.setFont(SANS, 7.6)
        lienzo.drawString(22 * mm, 11 * mm, "AutoPulse Elite · Reporte final")
        etiqueta = (
            f"Página {doc.page} de {self.total_paginas}"
            if self.total_paginas
            else f"Página {doc.page}"
        )
        lienzo.drawRightString(ancho - 22 * mm, 11 * mm, etiqueta)
        lienzo.restoreState()

    # -- índice -------------------------------------------------------------
    def afterFlowable(self, flowable):
        if not isinstance(flowable, Paragraph):
            return
        nombre = flowable.style.name
        if nombre == "H2":
            self.notify("TOCEntry", (0, flowable.getPlainText(), self.page))
        elif nombre == "H3":
            self.notify("TOCEntry", (1, flowable.getPlainText(), self.page))


# ---------------------------------------------------------------------------
# Historia
# ---------------------------------------------------------------------------
def separar_portada(markdown_texto: str):
    """Devuelve (titulo, subtitulo, cuerpo) sin perder texto: el título y el
    subtítulo se reutilizan en la portada diseñada."""
    lineas = markdown_texto.split("\n")
    titulo = "AutoPulse Elite"
    subtitulo = ""
    resto = []
    i = 0
    while i < len(lineas):
        linea = lineas[i]
        if i == 0 and linea.startswith("# "):
            titulo = linea[2:].strip()
            i += 1
            continue
        if linea.strip().startswith("<p align="):
            bloque = []
            while i < len(lineas) and "</p>" not in lineas[i]:
                bloque.append(lineas[i])
                i += 1
            if i < len(lineas):
                bloque.append(lineas[i])
                i += 1
            texto = " ".join(bloque)
            texto = re.sub(r"</?p[^>]*>", " ", texto)
            texto = texto.replace("<br>", "|").replace("<br/>", "|").replace("<br />", "|")
            texto = re.sub(r"<[^>]+>", "", texto)
            partes = [p.strip() for p in texto.split("|") if p.strip()]
            subtitulo = partes
            continue
        resto.append(linea)
        i += 1
    return titulo, subtitulo, "\n".join(resto)


def armar_historia(markdown_texto: str, sin_capturas: bool = False):
    titulo, subtitulo, cuerpo = separar_portada(markdown_texto)

    # La ficha del documento pasa de un autor a la lista completa del equipo.
    cuerpo = cuerpo.replace(
        "| **Autor** | Jonnatan Martinez Aquino |",
        "| **Autores** | "
        + ", ".join(AUTORES[:-1])
        + " y "
        + AUTORES[-1]
        + " |",
    )

    historia = []

    # ---- Portada ----
    historia.append(Spacer(1, 34 * mm))
    historia.append(Paragraph(titulo, E["titulo_portada"]))
    historia.append(Spacer(1, 6 * mm))
    if subtitulo:
        historia.append(Paragraph(inline(subtitulo[0]), E["subtitulo"]))
        if len(subtitulo) > 1:
            historia.append(Spacer(1, 2 * mm))
            historia.append(Paragraph(inline(" ".join(subtitulo[1:])), E["detalle"]))
    historia.append(Spacer(1, 9 * mm))
    historia.append(HRFlowable(width="32%", thickness=2.2, color=ORO, hAlign="CENTER"))
    historia.append(Spacer(1, 9 * mm))
    historia.append(Paragraph("REPORTE FINAL DE PRÁCTICA", E["tipo"]))
    historia.append(Spacer(1, 24 * mm))
    historia.append(HRFlowable(width="18%", thickness=0.8, color=ORO, hAlign="CENTER"))
    historia.append(Spacer(1, 6 * mm))
    historia.append(Paragraph("AUTORES", E["etiqueta"]))
    historia.append(Spacer(1, 3 * mm))
    for autor in AUTORES:
        historia.append(Paragraph(autor, E["autor"]))
    historia.append(Spacer(1, 16 * mm))
    historia.append(Paragraph("Pizarro Performance Garage", E["pie_portada"]))
    historia.append(Paragraph("22 de noviembre de 2026", E["pie_portada"]))
    historia.append(NextPageTemplate("cuerpo"))
    historia.append(PageBreak())

    # ---- Cuerpo ----
    inicio = True
    omitir = False
    toc = TableOfContents()
    toc.levelStyles = [E["toc0"], E["toc1"]]
    toc.dotsMinLevel = 0

    def agregar(flujo, espacio_antes=True):
        nonlocal inicio
        if not inicio and espacio_antes:
            historia.append(Spacer(1, 2.2))
        historia.append(flujo)
        inicio = False

    for tipo, contenido in bloques(cuerpo):
        if tipo == "h2" and sin_capturas and contenido.startswith("6."):
            omitir = True
            continue
        if tipo == "h2" and omitir and contenido.startswith("7."):
            omitir = False
        if omitir:
            continue

        if tipo == "h2":
            if not inicio:
                historia.append(PageBreak())
            historia.append(Paragraph(inline(contenido), E["H2"]))
            historia.append(Spacer(1, 3.5))
            historia.append(HRFlowable(width="100%", thickness=1.1, color=ORO, spaceAfter=7))
            inicio = False
        elif tipo == "h3":
            agregar(Paragraph(inline(contenido), E["H3"]))
        elif tipo == "h4":
            agregar(Paragraph(inline(contenido), E["H4"]))
        elif tipo == "parrafo":
            agregar(Paragraph(inline(contenido), E["cuerpo"]))
        elif tipo == "lista":
            for marca, texto in contenido:
                if texto.startswith("[ ]") or texto.startswith("[x]"):
                    texto = texto[3:].strip()
                    vineta = CASILLA
                elif re.match(r"^\d+[.)]$", marca):
                    vineta = marca
                else:
                    vineta = "\u2022"
                agregar(Paragraph(inline(texto), E["lista"], bulletText=vineta), False)
            historia.append(Spacer(1, 3))
        elif tipo == "tabla":
            tabla = construir_tabla(contenido)
            if tabla is not None:
                historia.append(Spacer(1, 2.5))
                historia.append(tabla)
                historia.append(Spacer(1, 5.5))
                inicio = False
        elif tipo == "codigo":
            historia.append(Spacer(1, 2))
            historia.append(construir_codigo(contenido[1]))
            historia.append(Spacer(1, 6))
            inicio = False
        elif tipo == "cita":
            historia.append(Spacer(1, 2))
            historia.append(construir_cita(contenido))
            historia.append(Spacer(1, 6))
            inicio = False
        elif tipo == "indice":
            if not inicio:
                historia.append(PageBreak())
            historia.append(Paragraph("Contenido", E["titulo_indice"]))
            historia.append(HRFlowable(width="100%", thickness=1.1, color=ORO, spaceAfter=10))
            historia.append(toc)
            historia.append(PageBreak())
            inicio = True
        elif tipo == "salto":
            if not inicio:
                historia.append(PageBreak())
            inicio = True

    return historia


# ---------------------------------------------------------------------------
# Construcción
# ---------------------------------------------------------------------------
def construir(destino: Path, markdown_texto: str, total=None, sin_capturas=False) -> int:
    doc = Informe(
        destino,
        total_paginas=total,
        leftMargin=22 * mm,
        rightMargin=22 * mm,
        topMargin=22 * mm,
        bottomMargin=22 * mm,
        title="AutoPulse Elite — Reporte final",
        author=", ".join(AUTORES),
        subject="Diseño, implementación y verificación de la base de datos de AutoPulse Elite",
        keywords="PostgreSQL, SQLAlchemy, FastAPI, React, base de datos, normalización, ingeniería inversa",
        creator="AutoPulse Elite",
        producer="ReportLab",
    )
    doc.multiBuild(armar_historia(markdown_texto, sin_capturas))
    return doc.page


def main() -> int:
    parser = argparse.ArgumentParser(description="Genera el PDF del reporte de AutoPulse Elite.")
    parser.add_argument("--entrada", default=str(ENTRADA), help="Markdown de origen")
    parser.add_argument("--salida", default=str(SALIDA), help="PDF de destino")
    parser.add_argument(
        "--sin-capturas",
        action="store_true",
        help="Omite el capítulo 6 (guion de capturas de pantalla)",
    )
    args = parser.parse_args()

    origen = Path(args.entrada)
    destino = Path(args.salida)
    if not origen.exists():
        print(f"No existe el archivo de entrada: {origen}")
        return 1

    markdown_texto = origen.read_text(encoding="utf-8")
    destino.parent.mkdir(parents=True, exist_ok=True)

    with tempfile.TemporaryDirectory() as tmp:
        borrador = Path(tmp) / "borrador.pdf"
        paginas = construir(borrador, markdown_texto, total=None, sin_capturas=args.sin_capturas)

    construir(destino, markdown_texto, total=paginas, sin_capturas=args.sin_capturas)
    print(f"PDF generado: {destino}")
    print(f"  Páginas: {paginas}")
    print(f"  Autores: {', '.join(AUTORES)}")
    if args.sin_capturas:
        print("  Capítulo 6 omitido (--sin-capturas)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
