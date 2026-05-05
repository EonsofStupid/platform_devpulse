# Did You Know — 100 Entries

> 81 general + 19 tool-specific. Ready for JSON conversion.

---

## HISTORY (12 entries)

### DYK-gen-001 | history | beginner
**Did you know** the term "artificial intelligence" was coined at a workshop at Dartmouth College in 1956? John McCarthy organized the event, and most attendees thought the problem would be solved within a generation. Nearly 70 years later, we're still working on it.
**Source:** Dartmouth AI Project Proposal, 1955
**Tags:** history, origins, john-mccarthy, dartmouth

### DYK-gen-002 | history | beginner
**Did you know** the first neural network, the Perceptron, was built in 1958 by Frank Rosenblatt at Cornell? The Navy funded it, and the New York Times predicted it would "walk, talk, see, write, and be conscious of its existence." That hype cycle crashed spectacularly by 1969.
**Source:** Rosenblatt, Cornell Aeronautical Laboratory
**Tags:** perceptron, neural-network, hype-cycle, frank-rosenblatt

### DYK-gen-003 | history | beginner
**Did you know** Alan Turing proposed the "Imitation Game" test in 1950 — six years before anyone used the term "artificial intelligence"? His question: if a machine can fool a human into thinking it's human, does it matter if it's "really" thinking?
**Source:** Turing, "Computing Machinery and Intelligence," 1950
**Tags:** turing-test, alan-turing, philosophy, history

### DYK-gen-004 | history | intermediate
**Did you know** the "AI Winter" happened twice? The first was in the 1970s when DARPA cut funding after overhyped promises. The second hit in the late 1980s when expert systems collapsed. Both times, researchers who stayed through the winter built the foundations of modern AI.
**Source:** Common knowledge, AI history surveys
**Tags:** ai-winter, funding, darpa, expert-systems

### DYK-gen-005 | history | beginner
**Did you know** IBM's Deep Blue beat world chess champion Garry Kasparov in 1997? Kasparov accused IBM of cheating and demanded a rematch. IBM refused and dismantled the machine. The controversy hasn't been fully resolved.
**Source:** IBM archives, Kasparov interviews
**Tags:** deep-blue, chess, kasparov, ibm, milestone

### DYK-gen-006 | history | intermediate
**Did you know** the backpropagation algorithm was rediscovered independently at least four times? Paul Werbos published it in 1974, but it stayed buried. Rumelhart, Hinton, and Williams popularized it in 1986 — and that paper launched the neural network revival.
**Source:** Werbos 1974; Rumelhart et al. 1986
**Tags:** backpropagation, hinton, history, algorithm

### DYK-gen-007 | history | intermediate
**Did you know** the transformer architecture that powers GPT, Claude, and Gemini came from a 2017 Google paper called "Attention Is All You Need"? The authors didn't predict it would replace recurrent networks for almost every language task.
**Source:** Vaswani et al., NeurIPS 2017
**Tags:** transformer, attention, google, history

### DYK-gen-008 | history | beginner
**Did you know** GPT-1 had 117 million parameters in 2018? GPT-4 is estimated at over a trillion. That's roughly a 10,000× increase in six years, yet the core architecture (transformer decoder) is almost unchanged.
**Source:** OpenAI papers
**Tags:** gpt, scaling, openai, history

### DYK-gen-009 | history | advanced
**Did you know** AlexNet won the 2012 ImageNet competition with such a huge margin that it single-handedly convinced the research community to take deep learning seriously? It was trained on two consumer GTX 580 GPUs.
**Source:** Krizhevsky, Sutskever, Hinton 2012
**Tags:** alexnet, imagenet, gpu, breakthrough

### DYK-gen-010 | history | beginner
**Did you know** the word "robot" comes from a 1920 Czech play called "R.U.R." by Karel Čapek? It's derived from "robota," meaning forced labor. The play ends with robots overthrowing humanity — a trope we've never stopped retelling.
**Source:** Čapek, "R.U.R." 1920
**Tags:** robot, etymology, history, pop-culture

### DYK-gen-011 | history | intermediate
**Did you know** ELIZA, the 1966 chatbot built by Joseph Weizenbaum at MIT, used pattern matching and reflection to simulate a psychotherapist? Weizenbaum was horrified when his secretary asked him to leave the room so she could have a "private" conversation with it.
**Source:** Weizenbaum, MIT 1966
**Tags:** eliza, chatbot, weizenbaum, history

### DYK-gen-012 | history | advanced
**Did you know** LSTMs (Long Short-Term Memory networks) were invented in 1997 by Hochreiter and Schmidhuber? They dominated sequence modeling for two decades until transformers replaced them almost overnight in 2017-2018.
**Source:** Hochreiter & Schmidhuber 1997
**Tags:** lstm, rnn, history, schmidhuber

---

## CONCEPTS (20 entries)

### DYK-gen-013 | concept | beginner
**Did you know** a "token" in large language models isn't always a word? "Unbelievable" might be split into "un", "believ", "able". This is why LLMs can sometimes struggle with rare words or long numbers — they see them as unfamiliar fragments.
**Tags:** tokens, tokenization, llm-basics

### DYK-gen-014 | concept | beginner
**Did you know** "context window" means the maximum amount of text an LLM can consider at once? Early GPT-3 had 2,048 tokens. Modern models stretch to millions. But bigger isn't always better — models often lose information in the middle of large contexts.
**Tags:** context-window, lost-in-middle, llm

### DYK-gen-015 | concept | beginner
**Did you know** "hallucination" in AI means the model making up facts with complete confidence? It's not lying — the model doesn't know the difference between recalling and inventing. This is why verification is critical for anything factual.
**Tags:** hallucination, reliability, llm-basics

### DYK-gen-016 | concept | intermediate
**Did you know** "temperature" in LLM settings controls randomness? At 0.0 the model picks the most likely next token every time (deterministic). At 1.0+ it takes more creative risks. Code generation usually works best at 0.0-0.3.
**Tags:** temperature, sampling, llm-tuning

### DYK-gen-017 | concept | intermediate
**Did you know** "RAG" (Retrieval-Augmented Generation) lets an LLM look up relevant documents before answering? It's how most modern AI tools handle large codebases — they don't "know" your code; they retrieve the relevant parts and read them fresh each time.
**Tags:** rag, retrieval, vector-search

### DYK-gen-018 | concept | intermediate
**Did you know** "embeddings" turn text into numbers (vectors) that capture meaning? "King - Man + Woman ≈ Queen" became a famous example. This is how AI tools find "similar" code or docs without keyword matching.
**Tags:** embeddings, vectors, semantic-search

### DYK-gen-019 | concept | advanced
**Did you know** "chain of thought" prompting (telling a model to think step by step) can dramatically improve complex reasoning? Google showed it boosts math accuracy on GSM8K from 18% to 57% with no model changes — just different prompts.
**Source:** Wei et al., Google Research 2022
**Tags:** chain-of-thought, prompting, reasoning

### DYK-gen-020 | concept | intermediate
**Did you know** "few-shot learning" means giving an LLM a few examples in the prompt before asking it to do the same? You don't retrain the model — you show it the pattern and it extrapolates. Often works better than detailed instructions.
**Tags:** few-shot, prompting, in-context-learning

### DYK-gen-021 | concept | advanced
**Did you know** "fine-tuning" permanently adjusts a model's weights for a specific task, while "prompting" doesn't change the model at all? Fine-tuning is expensive but persistent; prompting is cheap but resets every conversation.
**Tags:** fine-tuning, prompting, training

### DYK-gen-022 | concept | intermediate
**Did you know** "quantization" shrinks model size by using lower-precision numbers (like 4-bit instead of 16-bit)? A 70B model that needs 140GB at full precision can run in ~40GB at Q4 — losing only a tiny bit of quality.
**Tags:** quantization, model-compression, gguf

### DYK-gen-023 | concept | advanced
**Did you know** "attention" in transformers is literally a weighted lookup — each token decides how much it cares about every other token? This is why models scale quadratically with context length (twice the context = four times the compute).
**Tags:** attention, transformer, architecture

### DYK-gen-024 | concept | intermediate
**Did you know** "LoRA" (Low-Rank Adaptation) lets you fine-tune huge models by training only a small "adapter" layer? You can create specialized versions of a 7B model with less than 1GB of extra weights.
**Tags:** lora, adapters, fine-tuning

### DYK-gen-025 | concept | beginner
**Did you know** "prompt injection" is a security vulnerability where malicious text hidden in a document can hijack an AI assistant's behavior? It's the AI equivalent of SQL injection. If your AI agent reads untrusted web pages, this is a real threat.
**Tags:** prompt-injection, security, llm-risks

### DYK-gen-026 | concept | advanced
**Did you know** "mixture of experts" (MoE) models only activate a small subset of their parameters per token? A 30B MoE might only use 3B active parameters at any moment — dramatically cheaper inference for similar quality.
**Tags:** moe, mixture-of-experts, architecture

### DYK-gen-027 | concept | advanced
**Did you know** "constrained decoding" forces a model to produce output matching a grammar (like valid JSON or SQL)? Instead of hoping the model behaves, you mathematically prevent impossible tokens at each step. Tools like llguidance make this practical.
**Tags:** constrained-decoding, grammar, structured-output

### DYK-gen-028 | concept | intermediate
**Did you know** "KV cache" stores intermediate attention values so the model doesn't recompute them for every new token? It's the difference between AI being usable and unusably slow. Managing KV cache is the main challenge for long contexts.
**Tags:** kv-cache, inference-optimization, transformer

### DYK-gen-029 | concept | intermediate
**Did you know** "reranking" re-scores search results using a more expensive model? You retrieve 50 candidates with a fast embedder, then rerank the top 10 with a slower cross-encoder. You get much better results than either stage alone.
**Tags:** reranking, retrieval, two-stage

### DYK-gen-030 | concept | advanced
**Did you know** "speculative decoding" uses a small model to draft multiple tokens, then verifies them with the big model in parallel? You can get 2-3× faster generation with identical output. It's the main trick behind many "fast" inference engines.
**Tags:** speculative-decoding, inference, optimization

### DYK-gen-031 | concept | beginner
**Did you know** "agentic" AI means the model takes actions (calling tools, writing files, running commands) rather than just generating text? The tradeoff: more power, more risk. An agent with bad instructions can do real damage before you notice.
**Tags:** agents, agentic, tool-use

### DYK-gen-032 | concept | intermediate
**Did you know** "tool calling" is when an LLM decides to pause generation and call an external function (like a calculator, search, or API)? The model doesn't actually call it — it outputs a request, your code executes, and the result feeds back in.
**Tags:** tool-calling, function-calling, agents

---

## FIGURES (10 entries)

### DYK-gen-033 | figure | beginner
**Did you know** Geoffrey Hinton, Yann LeCun, and Yoshua Bengio shared the 2018 Turing Award for their work on deep learning? They're often called "the godfathers of AI" — though each has his own very different view on where the field should go next.
**Tags:** hinton, lecun, bengio, turing-award

### DYK-gen-034 | figure | beginner
**Did you know** Ilya Sutskever co-founded OpenAI in 2015 and was chief scientist through the launch of GPT-4? He left in 2024 to start Safe Superintelligence Inc. with the goal of building one product: safe ASI.
**Tags:** sutskever, openai, ssi

### DYK-gen-035 | figure | intermediate
**Did you know** Jürgen Schmidhuber claims (with some justification) to have anticipated most modern deep learning ideas in the 1990s? He's the inventor of LSTM and has a famously combative relationship with the "godfathers" over credit attribution.
**Tags:** schmidhuber, lstm, credit-wars

### DYK-gen-036 | figure | beginner
**Did you know** Andrej Karpathy wrote the first version of his "char-rnn" blog post in 2015, which taught a generation of engineers how neural networks work? He later led Tesla Autopilot and returned to building educational AI content.
**Tags:** karpathy, education, rnn

### DYK-gen-037 | figure | beginner
**Did you know** Demis Hassabis co-founded DeepMind in 2010 after careers as a chess prodigy, video game designer, and neuroscientist? DeepMind was acquired by Google in 2014 and went on to produce AlphaGo, AlphaFold, and Gemini.
**Tags:** hassabis, deepmind, google

### DYK-gen-038 | figure | intermediate
**Did you know** Dario and Daniela Amodei co-founded Anthropic in 2021 after leaving OpenAI with several colleagues over strategic differences? Anthropic has since focused heavily on AI safety research and built the Claude family of models.
**Tags:** amodei, anthropic, claude, safety

### DYK-gen-039 | figure | intermediate
**Did you know** François Chollet created Keras, one of the most popular deep learning libraries, during lunch breaks at his day job? He also designed the ARC-AGI benchmark, which remains one of the hardest tests for AI reasoning.
**Tags:** chollet, keras, arc-agi

### DYK-gen-040 | figure | advanced
**Did you know** Yann LeCun invented convolutional neural networks (CNNs) in the 1980s while at Bell Labs? They were used commercially for reading handwritten checks by the late 1990s — long before the 2012 ImageNet moment put deep learning on the map.
**Tags:** lecun, cnn, bell-labs

### DYK-gen-041 | figure | intermediate
**Did you know** Timnit Gebru was fired from Google in 2020 after raising concerns about the risks of large language models in a paper Google tried to suppress? She went on to found the Distributed AI Research Institute (DAIR).
**Tags:** gebru, ethics, dair

### DYK-gen-042 | figure | advanced
**Did you know** Judea Pearl won the Turing Award in 2011 for his work on causal reasoning and Bayesian networks? He argues modern deep learning still can't do true causal inference — only correlation at enormous scale.
**Tags:** pearl, causality, bayesian

---

## BREAKTHROUGHS (15 entries)

### DYK-gen-043 | breakthrough | beginner
**Did you know** AlphaGo beat world champion Lee Sedol in 2016? Move 37 in game 2 was so unusual that commentators initially thought it was a mistake. It's now considered one of the most creative moves in Go history — and it came from a machine.
**Source:** DeepMind, 2016
**Tags:** alphago, go, deepmind, move-37

### DYK-gen-044 | breakthrough | intermediate
**Did you know** AlphaFold 2 solved protein structure prediction in 2020 — a problem biologists had worked on for 50 years? DeepMind released predictions for 200 million proteins for free, accelerating drug discovery worldwide.
**Source:** DeepMind, Nature 2021
**Tags:** alphafold, biology, protein

### DYK-gen-045 | breakthrough | beginner
**Did you know** GPT-3's launch in 2020 surprised even OpenAI? It was the first model where scaling alone (more parameters, more data) produced qualitatively new capabilities like few-shot learning. The "scaling laws" paper that predicted this came out the same year.
**Source:** OpenAI, Kaplan et al. 2020
**Tags:** gpt-3, scaling-laws, emergence

### DYK-gen-046 | breakthrough | intermediate
**Did you know** the original ChatGPT (Nov 2022) was just GPT-3.5 plus a chat interface? OpenAI expected maybe 100k users in the first week. It hit a million in five days — the fastest adoption of any consumer product at the time.
**Source:** OpenAI
**Tags:** chatgpt, adoption, launch

### DYK-gen-047 | breakthrough | advanced
**Did you know** Stable Diffusion's 2022 release was a watershed moment — the first high-quality image model you could run on your own GPU? It launched an entire ecosystem of open-source image tools almost overnight.
**Source:** Stability AI, 2022
**Tags:** stable-diffusion, open-source, image-generation
