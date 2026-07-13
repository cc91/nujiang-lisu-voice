"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Language = "zh" | "lis";

type Phrase = {
  id: string;
  source: string;
  target: string;
  sourceLanguage: Language;
  note: string;
  createdAt: number;
};

type Recording = {
  url: string;
  duration: number;
};

type RecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
};

type RecognitionConstructor = new () => RecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: RecognitionConstructor;
    webkitSpeechRecognition?: RecognitionConstructor;
  }
}

const LANGUAGE_LABEL: Record<Language, string> = {
  zh: "中文",
  lis: "新傈僳文",
};

const QUICK_START = ["我想去医院", "请帮我找路", "孩子今天上学", "这里有水吗？"];

function phraseKey(text: string, language: Language) {
  return `${language}:${text.trim().replace(/\s+/g, " ").toLowerCase()}`;
}

export default function Home() {
  const [from, setFrom] = useState<Language>("zh");
  const [source, setSource] = useState("");
  const [result, setResult] = useState("");
  const [resultNote, setResultNote] = useState(
    "输入一句话，系统会优先检索已录入、待母语者审核的本地词条。"
  );
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [voiceHint, setVoiceHint] = useState("可以直接输入，也可以使用语音功能。 ");
  const [recording, setRecording] = useState<Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [draftTarget, setDraftTarget] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [notice, setNotice] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef(0);

  useEffect(() => {
    const stored = window.localStorage.getItem("nujiang-lisu-phrases");
    if (!stored) return;
    try {
      setPhrases(JSON.parse(stored));
    } catch {
      window.localStorage.removeItem("nujiang-lisu-phrases");
    }
  }, []);

  useEffect(() => {
    if (phrases.length) {
      window.localStorage.setItem("nujiang-lisu-phrases", JSON.stringify(phrases));
    }
  }, [phrases]);

  const targetLanguage: Language = from === "zh" ? "lis" : "zh";
  const matchingPhrase = useMemo(
    () => phrases.find((item) => phraseKey(item.source, item.sourceLanguage) === phraseKey(source, from)),
    [phrases, source, from]
  );

  function translate() {
    const text = source.trim();
    if (!text) {
      setResult("");
      setResultNote("请先输入或说出需要翻译的内容。");
      return;
    }
    if (matchingPhrase) {
      setResult(matchingPhrase.target);
      setResultNote(
        `来自本设备词库${matchingPhrase.note ? `：${matchingPhrase.note}` : "。请在发布前请母语者复核。"}`
      );
      return;
    }
    setResult("");
    setResultNote("暂未找到已录入的对应译文。可在下方“共建词条”补充翻译，系统会保存到本设备。 ");
  }

  function swapLanguages() {
    setFrom(targetLanguage);
    setSource(result || "");
    setResult(source || "");
    setResultNote("已交换方向。请重新点击翻译以检索本地词库。 ");
  }

  function startChineseSpeech() {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setVoiceHint("当前浏览器不支持语音转文字。请使用 Chrome 或直接输入。 ");
      return;
    }
    const recognition = new Recognition();
    recognition.lang = "zh-CN";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results as ArrayLike<any>)
        .map((item: any) => item[0]?.transcript || "")
        .join("");
      setSource(transcript);
    };
    recognition.onerror = () => {
      setVoiceHint("没有听清，请再试一次或改用文字输入。 ");
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
      setVoiceHint("中文语音已转为文字，可点击“翻译”。 ");
    };
    setIsListening(true);
    setVoiceHint("正在聆听中文…说完后会自动停止。 ");
    recognition.start();
  }

  async function startLisuRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setVoiceHint("当前浏览器无法录音。请使用手机 Chrome 或直接输入新傈僳文。 ");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      startedAtRef.current = Date.now();
      recorder.ondataavailable = (event) => {
        if (event.data.size) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecording({ url, duration: Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000)) });
        stream.getTracks().forEach((track) => track.stop());
        setIsRecording(false);
        setVoiceHint("已采集语音样本。当前版本会保留在本设备；转写模型将在有授权语料后接入。 ");
      };
      recorderRef.current = recorder;
      recorder.start();
      setIsRecording(true);
      setVoiceHint("正在采集傈僳语语音…再次点击即可结束。 ");
    } catch {
      setVoiceHint("未获得麦克风权限。可在浏览器设置中允许后重试。 ");
    }
  }

  function stopLisuRecording() {
    recorderRef.current?.stop();
  }

  function speakResult() {
    if (!result) return;
    if (targetLanguage === "lis") {
      setNotice("新傈僳文的真人自然朗读需要接入经授权的傈僳语 TTS 模型；当前网页不会把普通话语音冒充为傈僳语。 ");
      return;
    }
    if (!window.speechSynthesis) {
      setNotice("当前浏览器不支持朗读。 ");
      return;
    }
    const utterance = new SpeechSynthesisUtterance(result);
    utterance.lang = "zh-CN";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function savePhrase() {
    const sourceText = source.trim();
    const targetText = draftTarget.trim();
    if (!sourceText || !targetText) {
      setNotice("请先填写原文和对应译文。 ");
      return;
    }
    const newPhrase: Phrase = {
      id: `${Date.now()}`,
      source: sourceText,
      target: targetText,
      sourceLanguage: from,
      note: draftNote.trim() || "待母语者审核",
      createdAt: Date.now(),
    };
    setPhrases((current) => [newPhrase, ...current.filter((item) => phraseKey(item.source, item.sourceLanguage) !== phraseKey(sourceText, from))]);
    setDraftTarget("");
    setDraftNote("");
    setResult(targetText);
    setResultNote("已加入本设备词库，状态为待审核。 ");
    setNotice("词条已保存。 ");
  }

  function useQuickStart(text: string) {
    setFrom("zh");
    setSource(text);
    setResult("");
    setResultNote("这是一条高频场景句。录入经审核的新傈僳文译文后即可反复使用。 ");
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="怒江声译首页">
          <span className="brand-mark">N</span>
          <span>怒江声译 <em>Nujiang Lisu</em></span>
        </a>
        <nav aria-label="页面导航">
          <a href="#translate">翻译</a>
          <a href="#phrasebook">词条共建</a>
          <a href="#about">数据说明</a>
        </nav>
        <span className="version-pill">内测 · v0.1</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">面向怒江 · 新傈僳文（拉丁字母）</p>
          <h1>让每一句话，<br /><i>被认真听见。</i></h1>
          <p className="hero-summary">一个从真实使用场景出发的中文—傈僳语语音翻译工作台。先收集、再校对、后训练；不把未经审核的内容说成正确译文。</p>
          <div className="hero-actions">
            <a className="primary-action" href="#translate">开始翻译 <span>↓</span></a>
            <a className="text-action" href="#phrasebook">参与共建词条</a>
          </div>
        </div>
        <aside className="hero-card" aria-label="当前版本能力">
          <div className="hero-card-top"><span>正在建设</span><b>01</b></div>
          <div className="signal"><span /><span /><span /><span /><span /></div>
          <h2>声音先留下，<br />标准慢慢长出来。</h2>
          <p>中文语音转文字 · 傈僳语语音采集 · 本地词条检索</p>
        </aside>
      </section>

      <section className="translator-section" id="translate">
        <div className="section-heading">
          <div>
            <p className="eyebrow">翻译工作台</p>
            <h2>先说出来，再一起校准。</h2>
          </div>
          <p>首版只使用你本人或团队录入的本地词条；它不会编造傈僳语译文。</p>
        </div>

        <div className="translator-shell">
          <section className="translation-panel source-panel">
            <div className="panel-topline">
              <button className="language-select" onClick={() => setFrom("zh")} aria-pressed={from === "zh"}>中文 <span>⌄</span></button>
              <span className="panel-label">原文</span>
            </div>
            <textarea
              value={source}
              onChange={(event) => setSource(event.target.value)}
              placeholder={from === "zh" ? "输入中文，或点击下方麦克风说话" : "输入新傈僳文（拉丁字母）"}
              aria-label="原文输入"
            />
            <div className="panel-tools">
              <span>{source.length}/300</span>
              <button className="clear-button" onClick={() => setSource("")} disabled={!source}>清空</button>
            </div>
          </section>

          <button className="swap-button" onClick={swapLanguages} aria-label="交换翻译方向">⇄</button>

          <section className="translation-panel result-panel">
            <div className="panel-topline">
              <span className="language-result">{LANGUAGE_LABEL[targetLanguage]}</span>
              <span className="panel-label">译文</span>
            </div>
            <div className={`translation-output ${result ? "has-result" : ""}`}>
              {result || "译文将在这里显示"}
            </div>
            <div className="result-footer">
              <span className="status-dot" /> <span>{result ? "本地词条命中" : "等待词条或审核译文"}</span>
              <button className="speak-button" onClick={speakResult} disabled={!result}>朗读</button>
            </div>
          </section>

          <div className="translate-controls">
            <div className="voice-strip">
              {from === "zh" ? (
                <button className={`voice-button ${isListening ? "active" : ""}`} onClick={startChineseSpeech}>
                  <span className="microphone">●</span>{isListening ? "正在聆听中文" : "说中文"}
                </button>
              ) : (
                <button className={`voice-button ${isRecording ? "active" : ""}`} onClick={isRecording ? stopLisuRecording : startLisuRecording}>
                  <span className="microphone">●</span>{isRecording ? "结束采集" : "采集傈僳语声音"}
                </button>
              )}
              <span>{voiceHint}</span>
              {recording && <audio controls src={recording.url} aria-label={`已采集的傈僳语录音，${recording.duration}秒`} />}
            </div>
            <button className="translate-button" onClick={translate}>翻译 <span>→</span></button>
          </div>

          <div className="translation-note"><span>◇</span>{resultNote}</div>
        </div>
      </section>

      <section className="quick-section" aria-label="高频场景">
        <p>试试这些高频场景</p>
        <div>{QUICK_START.map((item) => <button key={item} onClick={() => useQuickStart(item)}>{item} <span>↗</span></button>)}</div>
      </section>

      <section className="build-section" id="phrasebook">
        <div className="build-copy">
          <p className="eyebrow">词条共建</p>
          <h2>好翻译不是猜出来的，<br />是一起核对出来的。</h2>
          <p>把本地常说的话、正确的新傈僳文写法和使用情境放进词库。当前条目仅保存在本设备，适合先由社区小范围试用和校对。</p>
          <div className="principles">
            <span><b>01</b> 标注方言与情境</span>
            <span><b>02</b> 保留校对记录</span>
            <span><b>03</b> 经同意再用于训练</span>
          </div>
        </div>
        <form className="phrase-form" onSubmit={(event) => { event.preventDefault(); savePhrase(); }}>
          <div className="form-kicker"><span>添加一个词条</span><em>本地保存</em></div>
          <label>原文 <small>将使用上方输入内容</small><input value={source} onChange={(event) => setSource(event.target.value)} placeholder="例如：我想去医院" /></label>
          <label>对应译文 <small>{targetLanguage === "lis" ? "请填写新傈僳文（拉丁字母）" : "请填写中文"}</small><input value={draftTarget} onChange={(event) => setDraftTarget(event.target.value)} placeholder={targetLanguage === "lis" ? "填写经确认的新傈僳文" : "填写对应中文"} /></label>
          <label>备注 <small>方言、场景或审核人</small><input value={draftNote} onChange={(event) => setDraftNote(event.target.value)} placeholder="例如：福贡县口语，待王老师复核" /></label>
          <button className="save-button" type="submit">保存待审核词条 <span>+</span></button>
          {notice && <p className="form-notice" role="status">{notice}</p>}
        </form>
      </section>

      <section className="local-entries" aria-label="本地词条">
        <div className="entries-heading"><h2>本设备词条</h2><span>{phrases.length} 条</span></div>
        {phrases.length ? (
          <div className="entries-grid">
            {phrases.slice(0, 6).map((item) => (
              <article className="entry-card" key={item.id}>
                <span>{LANGUAGE_LABEL[item.sourceLanguage]} → {LANGUAGE_LABEL[item.sourceLanguage === "zh" ? "lis" : "zh"]}</span>
                <strong>{item.source}</strong>
                <p>{item.target}</p>
                <small>待审核 · {item.note}</small>
              </article>
            ))}
          </div>
        ) : <p className="empty-entries">还没有本地词条。第一条经审核的常用语，会是词库的开始。</p>}
      </section>

      <section className="about-section" id="about">
        <div><p className="eyebrow">数据说明</p><h2>把正确性放在“快”之前。</h2></div>
        <div className="about-grid">
          <article><b>文字</b><p>首发面向怒江地区的新傈僳文（拉丁字母），所有拼写需由本地使用者确认。</p></article>
          <article><b>声音</b><p>中文可调用浏览器语音转写；傈僳语先进行语音采集，不假装已有可靠识别能力。</p></article>
          <article><b>隐私</b><p>本原型的词条与录音预览留在当前设备。正式上传前应取得录音人同意并清楚标明用途。</p></article>
        </div>
      </section>

      <footer><span>怒江声译 · 新傈僳文内测原型</span><span>由社区语言使用者共同校对</span></footer>
    </main>
  );
}
