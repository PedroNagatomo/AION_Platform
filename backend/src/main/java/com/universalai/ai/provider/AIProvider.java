package com.universalai.ai.provider;

import com.universalai.ai.model.AIRequest;
import com.universalai.ai.model.AIResponse;

public interface AIProvider {
    AIResponse chat(AIRequest request);
    String getProviderName();
}