"""
Sentiment analysis module — analyzes the emotional tone of user messages
using TextBlob NLP. This is the 3rd AI technique in the pipeline:
RAG (retrieval) + LLM (generation) + Sentiment Analysis (NLP understanding).
"""

from textblob import TextBlob


import re

# Keyword override patterns — TextBlob misses strong emotional signals
# in short/informal text. These catch what polarity averaging misses.
_ANGUISHED_PATTERNS = re.compile(
    r"\b(kill\s*(my|him|her|them|our)?self|suicide|wanna die|want to die"
    r"|end it all|no reason to live|can'?t go on|don'?t want to live"
    r"|rather be dead|better off dead|hate myself|hopeless"
    r"|murder|slaughter|bloodshed|agony|torment|torture"
    r"|only way out|no way out|no escape"
    r"|death is.*(?:only|the)\s*way"
    r"|(?:only|one)\s*way\s*(?:is|to)\s*die"
    r"|want\s*(?:to\s*)?(?:be\s*)?dead"
    r"|life\s*(?:is\s*)?(?:not\s*)?worth"
    r"|(?:i\s*)?(?:should|wanna|gonna)\s*die)\b",
    re.IGNORECASE,
)

_SOMBER_PATTERNS = re.compile(
    r"\b(death|dying|dead|grief|mourn|loss|lost|funeral"
    r"|weep|tears|crying|suffer|suffering|misery|miserable"
    r"|lonely|alone|abandon|betray|regret|guilt|shame"
    r"|broke my heart|heartbreak|heartbroken|devastat"
    r"|burden|wound|wounds|bleeding|fade|fading|darkness"
    r"|sorrow|farewell|grave|grave[s]?|bury|buried"
    r"|weariness|weary|exhausted|hollow|emptiness)\b",
    re.IGNORECASE,
)

# Nihilistic / despair patterns — short, hopeless statements that TextBlob
# scores as neutral because they lack traditional sentiment vocabulary.
_DESPAIR_PATTERNS = re.compile(
    r"\b(nothing|nothing matters|don'?t care|doesn'?t matter"
    r"|no point|what'?s the (?:point|use)|pointless|worthless"
    r"|give up|giving up|gave up|tired|exhausted|can'?t anymore"
    r"|don'?t believe|no hope|empty|numb|done)\b",
    re.IGNORECASE,
)

_WARM_PATTERNS = re.compile(
    r"\b(thank|grateful|appreciate|bless|kind|love you"
    r"|proud of you|forgive|peace|comfort|friend|brother"
    r"|gentle|tender|care for|take care"
    r"|hope|spark|light|strength|beautiful|beauty"
    r"|courage|brave|remember|protect)\b",
    re.IGNORECASE,
)


def analyze_sentiment(text: str) -> dict:
    """
    Analyze the emotional tone of a user message.

    Uses TextBlob polarity as a baseline, then applies keyword-based
    overrides to catch strong emotional signals that polarity averaging misses.

    Returns:
        {
            "polarity": float,    # -1.0 (negative) to 1.0 (positive)
            "subjectivity": float, # 0.0 (objective) to 1.0 (subjective)
            "label": str,         # Human-readable emotion label
            "intensity": float,   # 0.0 to 1.0 — strength of emotion
        }
    """
    blob = TextBlob(text)
    polarity = blob.sentiment.polarity
    subjectivity = blob.sentiment.subjectivity

    # --- Keyword override layer ---
    # Check for strong emotional patterns that TextBlob's averaging misses
    anguished_hits = len(_ANGUISHED_PATTERNS.findall(text))
    somber_hits = len(_SOMBER_PATTERNS.findall(text))
    despair_hits = len(_DESPAIR_PATTERNS.findall(text))
    warm_hits = len(_WARM_PATTERNS.findall(text))

    if anguished_hits > 0:
        # Force anguished — these are unmistakable signals
        polarity = min(polarity, -0.6)
        subjectivity = max(subjectivity, 0.8)
    elif despair_hits >= 1 and polarity > -0.15:
        # Nihilistic / hopeless short statements — TextBlob misses these
        polarity = min(polarity, -0.25)
        subjectivity = max(subjectivity, 0.7)
    elif somber_hits >= 1 and polarity > -0.15:
        # Even a single death/grief keyword is significant in this context
        polarity = min(polarity, -0.2)
        subjectivity = max(subjectivity, 0.6)
    elif warm_hits >= 1 and polarity < 0.15:
        # Warm keywords — hope, beauty, kindness
        polarity = max(polarity, 0.2)

    # Map polarity to narrative-appropriate emotion labels
    if polarity <= -0.4:
        label = "anguished"
    elif polarity < -0.15:
        label = "somber"
    elif polarity < 0.15:
        label = "calm"
    elif polarity < 0.4:
        label = "warm"
    else:
        label = "compassionate"

    # Intensity is the absolute strength of emotion (0–1)
    intensity = min(abs(polarity) * 1.5, 1.0)

    return {
        "polarity": round(polarity, 3),
        "subjectivity": round(subjectivity, 3),
        "label": label,
        "intensity": round(intensity, 3),
    }


# ── Dynamic effect text generation ───────────────────────────────���──────
# Each label has phrases bucketed by intensity (low / mid / high).
# Subjectivity splits each bucket further: objective ≤ 0.5 < subjective.
# Stage adds a dying-breath modifier at stage 3.

_EFFECT_PHRASES: dict[str, dict[str, list[str]]] = {
    "anguished": {
        "low_obj": [
            "a shadow passes over his face",
            "his jaw tightens, words held back",
            "something dark flickers behind his eyes",
            "his hand grips the blanket, knuckles white",
        ],
        "low_sub": [
            "old memories stir behind his eyes",
            "a ghost of something painful crosses his face",
            "he stares past you, into another time",
            "his breath catches on a buried memory",
        ],
        "mid_obj": [
            "his voice cracks under the weight",
            "the words come out jagged, broken",
            "his voice drops, roughened by old grief",
            "each word falls heavy as a stone",
        ],
        "mid_sub": [
            "his words bleed with old wounds",
            "he speaks through clenched teeth, barely holding on",
            "the mask slips and raw hurt shows through",
            "his voice trembles with something he won't name",
        ],
        "high_obj": [
            "he responds with raw, bleeding honesty",
            "the truth tears out of him like a bullet",
            "his voice breaks open, nothing left to hide",
            "he speaks as though confessing to the desert itself",
        ],
        "high_sub": [
            "his pain spills out, unguarded",
            "tears threaten but he fights them back",
            "his whole body shudders with the weight of it",
            "the wound in his voice goes deeper than the one in his chest",
        ],
    },
    "somber": {
        "low_obj": [
            "his gaze drifts to the window",
            "he watches the shadows on the wall",
            "his eyes settle on something far away",
            "the lamplight catches the lines on his face",
        ],
        "low_sub": [
            "a quiet sigh escapes him",
            "his shoulders drop, just slightly",
            "a tiredness settles into his bones",
            "he lets the silence hang a moment longer",
        ],
        "mid_obj": [
            "his words carry a quiet weight",
            "he speaks like a man reading his own epitaph",
            "his voice thins, stretched across too many years",
            "the gravity of it all pulls at his words",
        ],
        "mid_sub": [
            "a deep weariness fills his voice",
            "he sounds like a man who's buried too many friends",
            "regret colors every syllable",
            "his voice carries the dust of a hundred lonely trails",
        ],
        "high_obj": [
            "he speaks as if carrying the whole desert on his back",
            "every word sounds like a farewell",
            "he talks the way the wind sounds before a storm",
            "his voice is the sound of doors closing one by one",
        ],
        "high_sub": [
            "sorrow seeps through every word",
            "grief sits heavy on his tongue",
            "his voice is a lantern guttering in the wind",
            "he speaks as though the words are all he has left",
        ],
    },
    "calm": {
        "low_obj": [
            "he speaks with measured breath",
            "his words come slow and deliberate",
            "he answers plainly, without ornament",
            "his voice is level as the horizon line",
        ],
        "low_sub": [
            "his tone is steady, unhurried",
            "he speaks the way a man whittles wood — patient, sure",
            "there's no rush left in him",
            "he lets the words settle like dust after a ride",
        ],
        "mid_obj": [
            "a quiet certainty settles in his words",
            "he speaks with the stillness of a man who's made his peace",
            "his voice carries the calm of an empty church",
            "he answers like he's known the question was coming",
        ],
        "mid_sub": [
            "he holds his ground, voice even",
            "a practiced steadiness shapes his words",
            "he speaks from a place beyond fear",
            "his calm is earned, not given",
        ],
        "high_obj": [
            "he answers as if time no longer matters",
            "his voice belongs to another world already",
            "he speaks with the patience of stone",
            "the words come as naturally as breathing",
        ],
        "high_sub": [
            "a still clarity shapes his voice",
            "he speaks from somewhere deep and unshakable",
            "perfect stillness wraps around his words",
            "his calm is absolute, almost unsettling",
        ],
    },
    "warm": {
        "low_obj": [
            "something softens in his eyes",
            "the hard lines of his face ease, just for a moment",
            "a flicker of kindness crosses his weathered face",
            "his expression gentles without him noticing",
        ],
        "low_sub": [
            "the edge leaves his voice for a moment",
            "he almost smiles — almost",
            "a hint of the man he was before the badge shows through",
            "his voice loses its roughness, just briefly",
        ],
        "mid_obj": [
            "a rare warmth enters his voice",
            "his words carry a tenderness he rarely shows",
            "he speaks the way firelight fills a cold room",
            "something human and unguarded slips into his tone",
        ],
        "mid_sub": [
            "he lets his guard down, just a little",
            "he speaks like a man remembering what it felt like to hope",
            "the lawman fades and the man underneath appears",
            "he looks at you the way he might've looked at a friend, once",
        ],
        "high_obj": [
            "his voice gentles like a lamp in the dark",
            "he speaks with the warmth of a hand on a shoulder",
            "his words glow like embers in the hearth",
            "tenderness fills his voice like sunlight through a window",
        ],
        "high_sub": [
            "warmth breaks through the tough exterior",
            "he speaks with a love he didn't know he still had",
            "his voice opens up like a door he forgot to lock",
            "something in him reaches out, unafraid at last",
        ],
    },
    "compassionate": {
        "low_obj": [
            "his words carry unexpected gentleness",
            "he chooses his words with quiet care",
            "a softness enters his voice, unbidden",
            "he speaks gently, as if handling something fragile",
        ],
        "low_sub": [
            "something tender slips past his defenses",
            "he looks at you with understanding he can't explain",
            "empathy flickers in his tired eyes",
            "he sees something in you that reminds him of himself",
        ],
        "mid_obj": [
            "he opens up with surprising tenderness",
            "his words land soft as a hand on a wound",
            "he speaks the way a preacher might, if he truly believed",
            "his voice holds a kindness that the desert never taught him",
        ],
        "mid_sub": [
            "his voice fills with genuine feeling",
            "he speaks as if your pain were his own",
            "compassion deepens the lines around his eyes",
            "he reaches across the space between you with his words",
        ],
        "high_obj": [
            "he speaks as if he's known you a lifetime",
            "his words carry the weight of a benediction",
            "he offers his words like a man offering water in the desert",
            "every syllable is a gift he's choosing to give",
        ],
        "high_sub": [
            "his heart opens wide in his final hours",
            "he pours everything he has left into his words",
            "love — simple, unadorned — fills his dying voice",
            "he gives you the truest thing he has: his understanding",
        ],
    },
}

_STAGE_3_SUFFIXES = [
    "...barely above a whisper",
    "...his voice fading",
    "...each word costing him",
    "...the words dissolving into breath",
    "...as the lamplight flickers low",
    "...his strength bleeding away with every syllable",
    "...the silence rushing in behind each word",
]


def generate_response_effect(
    sentiment_data: dict, stage: int = 1, response_text: str = ""
) -> str:
    """
    Generate a dynamic, one-line description of how the sheriff responded,
    based on polarity, subjectivity, conversation stage, and the actual
    response content (used as a seed for variation).
    """
    label = sentiment_data["label"]
    intensity = sentiment_data["intensity"]
    subjectivity = sentiment_data["subjectivity"]

    # Determine intensity bucket
    if intensity < 0.3:
        bucket = "low"
    elif intensity < 0.6:
        bucket = "mid"
    else:
        bucket = "high"

    # Determine subjectivity suffix
    sub_key = "sub" if subjectivity > 0.5 else "obj"

    key = f"{bucket}_{sub_key}"
    phrases = _EFFECT_PHRASES.get(label, _EFFECT_PHRASES["calm"])
    candidates = phrases.get(key, phrases.get(f"{bucket}_obj", ["he speaks"]))

    # Use a hash of the actual response text for variation —
    # different responses produce different effects even within the same bucket
    seed = hash(response_text) if response_text else int(
        abs(sentiment_data["polarity"]) * 1000
    )
    idx = abs(seed) % len(candidates)
    text = candidates[idx]

    # Stage 3: append a dying-breath modifier
    if stage >= 3:
        suffix_idx = abs(hash(response_text + "_suffix")) % len(_STAGE_3_SUFFIXES)
        text += _STAGE_3_SUFFIXES[suffix_idx]

    return text
