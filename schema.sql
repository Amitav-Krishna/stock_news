--
-- PostgreSQL database dump
--

-- Dumped from database version 16.8 (Ubuntu 16.8-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.8 (Ubuntu 16.8-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET:warning row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: amitavkrishna
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO amitavkrishna;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: amitavkrishna
--

COMMENT ON SCHEMA public IS '';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: news_articles; Type: TABLE; Schema: public; Owner: amitavkrishna
--

CREATE TABLE public.news_articles (
    ticker text NOT NULL,
    "time" timestamp with time zone NOT NULL,
    title text,
    link text,
    snippet text
);


ALTER TABLE public.news_articles OWNER TO amitavkrishna;

--
-- Name: stock_data; Type: TABLE; Schema: public; Owner: amitavkrishna
--

CREATE TABLE public.stock_data (
    ticker text NOT NULL,
    "time" timestamp with time zone NOT NULL,
    price numeric NOT NULL,
    volume bigint
);


ALTER TABLE public.stock_data OWNER TO amitavkrishna;

--
-- Name: news_articles news_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: amitavkrishna
--

ALTER TABLE ONLY public.news_articles
    ADD CONSTRAINT news_articles_pkey PRIMARY KEY (ticker, "time");


--
-- Name: news_articles news_articles_ticker_title_time_key; Type: CONSTRAINT; Schema: public; Owner: amitavkrishna
--

ALTER TABLE ONLY public.news_articles
    ADD CONSTRAINT news_articles_ticker_title_time_key UNIQUE (ticker, title, "time");


--
-- Name: stock_data stock_data_pkey; Type: CONSTRAINT; Schema: public; Owner: amitavkrishna
--

ALTER TABLE ONLY public.stock_data
    ADD CONSTRAINT stock_data_pkey PRIMARY KEY (ticker, "time");


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: amitavkrishna
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;

---
--- 


--
-- PostgreSQL database dump complete
--

