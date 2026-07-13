"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Candidate = {
  id: string;
  text: string;
  scene: string;
  source: string;
  createdAt: number;
};

const STARTER_PHRASES = [
  { scene: "医院", text: "我需要去医院。" },
  { scene: "医院", text: "请问最近的卫生院在哪里？" },
  { scene: "出行", text: "请问去这里怎么走？" },
  { scene: "出行", text: "这趟车到县城吗？" },
  { scene: "办事", text: "请帮我填写这张表。" },
  { scene: "办事", text: "我想咨询办理流程。" },
  { scene: "日常", text: "请慢一点说，我没有听清。" },
  { scene: "日常", text: "谢谢你的帮助。" },
];

const SCENES = ["医院", "出行", "办事", "日常"];

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(timestamp);
}

export default function Home() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [text, setText] = useState("");
  const [scene, setScene] = useState("医院");
  const [source, setSource] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("nujiang-lisu-candidate-phrases");
      if (stored) setCandidates(JSON.parse(stored));
    } catch {
      window.localStorage.removeItem("nujiang-lisu-candidate-phrases");
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("nujiang-lisu-candidate-phrases", JSON.stringify(candidates));
  }, [candidates]);

  const sceneCounts = useMemo(
    () => SCENES.map((item) => ({ name: item, count: candidates.filter((candidate) => candidate.scene === item).length })),
    [candidates]
  );

  function saveCandidate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleanText = text.trim();
    if (!cleanText) {
      setNotice("请先填写一条中文候选句。");
      return;
    }
    setCandidates((current) => [
      {
        id: `${Date.now()}`,
        text: cleanText,
        scene,
        source: source.trim(),
        createdAt: Date.now(),
      },
      ...current.filter((item) => item.text !== cleanText),
    ]);
    setText("");
    setSource("");
    setNotice("已加入本机待翻译清单。它尚未公开，也还不是已审核译文。");
  }

  function useStarter(item: (typeof STARTER_PHRASES)[number]) {
    setText(item.text);
    setScene(item.scene);
    setNotice("已放入采集表。可补充来源或备注后保存。");
    document.getElementById("collect")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="怒江傈僳语共建计划首页">
          <span className="brand-mark">N</span>
          <span>怒江傈僳语 <em>community language project</em></span>
        </a>
        <nav aria-label="页面导航">
          <a href="#plan">项目方法</a>
          <a href="#collect">词条清单</a>
          <a href="#join">寻找贡献者</a>
        </nav>
        <span className="version-pill">共建筹备中</span>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow">面向怒江 · 新傈僳文（拉丁字母）</p>
          <h1>让傈僳语被认真记录，<br /><i>也被正确传下去。</i></h1>
          <p className="hero-summary">
            这是一个由语言使用者共同建设的词条计划。我们先收集常用中文、再由母语者录入与复核，最后才把经过确认的内容做成可用的翻译工具。
          </p>
          <div className="hero-actions">
            <a className="primary-action" href="#collect">准备第一批词条 <span>↓</span></a>
            <a className="text-action" href="#join">我认识语言贡献者</a>
          </div>
        </div>
        <aside className="hero-card" aria-label="本期目标">
          <div className="hero-card-top"><span>本期目标</span><b>01</b></div>
          <div className="signal"><span /><span /><span /><span /><span /></div>
          <h2>先完成一个场景，<br />再扩大到更多日常。</h2>
          <p>第一阶段：医院、出行、办事与日常沟通的 100 条中文候选句。</p>
          <div className="goal-status"><span />等待母语者加入</div>
        </aside>
      </section>

      <section className="truth-banner" aria-label="当前阶段说明">
        <strong>当前不是自动翻译器。</strong>
        <span>网站正在建立可靠词库；没有经过母语者确认的傈僳语译文，就不显示“机器翻译结果”。</span>
      </section>

      <section className="plan-section" id="plan">
        <div className="section-heading">
          <div>
            <p className="eyebrow">建设方法</p>
            <h2>不懂傈僳语，也能把项目做对。</h2>
          </div>
          <p>项目发起人负责场景、组织和经费；语言正确性由傈僳语使用者负责。每一条内容都保留来源、审核与授权记录。</p>
        </div>
        <div className="process-grid">
          <article><b>01</b><h3>整理中文候选句</h3><p>从医院、出行、办事等真实需求出发，先列出需要表达什么。</p></article>
          <article><b>02</b><h3>母语者录入写法与声音</h3><p>填写新傈僳文，标注地区或使用情境；录音必须先取得同意。</p></article>
          <article><b>03</b><h3>另一位使用者复核</h3><p>不把单人答案直接发布。存在分歧时，保留说明与修订记录。</p></article>
          <article><b>04</b><h3>发布可信词库</h3><p>先提供可检索的常用短句；数据积累后再评估翻译和语音模型。</p></article>
        </div>
      </section>

      <section className="collection-section" id="collect">
        <div className="collection-copy">
          <p className="eyebrow">第一批词条</p>
          <h2>先从 100 句中文开始。</h2>
          <p>你可以从网络上的中文高频句清单中挑选生活化短句，也可以自己整理。请记录来源；它们只作为“待翻译任务”，不能被当作傈僳语译文或训练数据。</p>
          <div className="scene-counts">
            {sceneCounts.map((item) => <span key={item.name}><b>{item.count}</b>{item.name}</span>)}
          </div>
          <div className="source-note"><b>选句原则</b> 短、具体、可在真实场景中说出口；避免小说、歌词、私人信息与带歧义的长段文字。</div>
        </div>

        <form className="candidate-form" onSubmit={saveCandidate}>
          <div className="form-kicker"><span>新增中文候选句</span><em>本机草稿</em></div>
          <label>中文句子<textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="例如：请问最近的卫生院在哪里？" maxLength={120} /></label>
          <div className="form-row">
            <label>使用场景<select value={scene} onChange={(event) => setScene(event.target.value)}>{SCENES.map((item) => <option key={item}>{item}</option>)}</select></label>
            <label>来源或备注<input value={source} onChange={(event) => setSource(event.target.value)} placeholder="例如：生活场景整理" /></label>
          </div>
          <button className="save-button" type="submit">加入待翻译清单 <span>+</span></button>
          {notice && <p className="form-notice" role="status">{notice}</p>}
        </form>
      </section>

      <section className="starter-section" aria-label="可直接使用的候选句">
        <div className="starter-heading"><div><p className="eyebrow">快速起步</p><h2>可以先收集这些。</h2></div><span>点击任一句，放入上方清单</span></div>
        <div className="starter-grid">
          {STARTER_PHRASES.map((item) => <button key={item.text} onClick={() => useStarter(item)}><small>{item.scene}</small><strong>{item.text}</strong><span>加入清单 →</span></button>)}
        </div>
      </section>

      <section className="local-entries" aria-label="本机候选句">
        <div className="entries-heading"><h2>本机待翻译清单</h2><span>{candidates.length} 条</span></div>
        {candidates.length ? (
          <div className="entries-grid">
            {candidates.slice(0, 6).map((item) => <article className="entry-card" key={item.id}><span>{item.scene} · {formatDate(item.createdAt)}</span><strong>{item.text}</strong><p>{item.source || "未记录来源"}</p><small>等待母语者录入与复核</small></article>)}
          </div>
        ) : <p className="empty-entries">还没有候选句。先从上方选一句，或把你找到的中文高频句加入清单。</p>}
      </section>

      <section className="join-section" id="join">
        <div className="join-copy">
          <p className="eyebrow">寻找语言贡献者</p>
          <h2>每一位使用者，都是语言的老师。</h2>
          <p>项目需要愿意提供语言知识的人。最理想的是至少两位傈僳语母语者，其中一位能读写新傈僳文；也欢迎教师、社区工作者与愿意协助录音的人加入。</p>
        </div>
        <div className="role-list">
          <article><span>01</span><h3>录入者</h3><p>说傈僳语，愿意写出当地常用的新傈僳文表达。</p></article>
          <article><span>02</span><h3>复核者</h3><p>独立检查拼写、含义与地区使用习惯，并标明不同说法。</p></article>
          <article><span>03</span><h3>项目支持者</h3><p>帮助联系社区、安排有偿试点，或提供真实使用场景。</p></article>
        </div>
      </section>

      <section className="about-section" id="about">
        <div><p className="eyebrow">数据承诺</p><h2>先取得同意，<br />再谈技术与规模。</h2></div>
        <div className="about-grid">
          <article><b>准确</b><p>不把未知内容伪装成翻译结果；每条公开译文都应有明确审核状态。</p></article>
          <article><b>尊重</b><p>录音、姓名与地区信息在收集前说明用途，允许贡献者拒绝或撤回。</p></article>
          <article><b>共享</b><p>当前网页只保存本机草稿。正式共建前，会接入带审核记录的共享词库。</p></article>
        </div>
      </section>

      <footer><span>怒江傈僳语共建计划 · 筹备版</span><span>先记录，再校对，再发布。</span></footer>
    </main>
  );
}
