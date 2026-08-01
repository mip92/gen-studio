# -*- coding: utf-8 -*-
"""Shot engine for optimizer («ТЫ — Оптимизатор») — reuses the hidden_layoff
engine (2026-07-30 rule set) with this project's constants."""
import _hidden_layoff_engine as E

E.PFX = "7e740000-0000-4000-8000-"
E.PROJ = E.PFX + "000000000001"
E.ROUTE_C = "optimizer_character_ip"
E.ROUTE_E = "optimizer_environment"

seed_act = E.seed_act
