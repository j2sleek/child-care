import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import {
  useAiInsights,
  useAiRecommendations,
  useAiAnomalies,
  useAiDigest,
  useAiChat,
} from '../../../../src/hooks/useAi';
import { ProGate } from '../../../../src/components/ProGate';
import { AiChatBubble } from '../../../../src/components/AiChatBubble';
import { Card } from '../../../../src/components/ui/Card';
import { Badge } from '../../../../src/components/ui/Badge';
import { ChatMessage } from '../../../../src/api/endpoints/ai';
import i18n from '../../../../src/lib/i18n';

type Tab = 'insights' | 'chat' | 'digest';

export default function AiScreen() {
  const { childId } = useLocalSearchParams<{ childId: string }>();
  const [tab, setTab] = useState<Tab>('insights');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const insights = useAiInsights(childId);
  const recommendations = useAiRecommendations(childId);
  const anomalies = useAiAnomalies(childId);
  const digest = useAiDigest(childId);
  const chat = useAiChat(childId);

  const sendMessage = () => {
    const msg = inputText.trim();
    if (!msg) return;
    const newHistory: ChatMessage[] = [...chatHistory, { role: 'user', content: msg }];
    setChatHistory(newHistory);
    setInputText('');
    chat.mutate(
      { message: msg, history: chatHistory },
      {
        onSuccess: (data) => {
          setChatHistory((h) => [...h, { role: 'assistant', content: data.reply }]);
          setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
        },
      }
    );
  };

  const TABS: Tab[] = ['insights', 'chat', 'digest'];

  return (
    <ProGate feature="AI insights">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 bg-gray-50"
      >
        <View className="flex-row px-4 pt-3 gap-2 mb-2">
          {TABS.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTab(t)}
              className={`flex-1 py-2 rounded-xl items-center border ${
                tab === t ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'
              }`}
            >
              <Text className={`text-xs font-semibold capitalize ${tab === t ? 'text-primary-600' : 'text-gray-500'}`}>
                {i18n.t(`ai.${t}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'insights' && (
          <ScrollView className="flex-1 px-4">
            {insights.isLoading ? (
              <ActivityIndicator className="mt-10" color="#6366f1" />
            ) : (
              <>
                <Text className="text-sm font-semibold text-gray-500 uppercase mb-2 mt-2">
                  {i18n.t('ai.insights')}
                </Text>
                {insights.data?.insights?.map((ins, i) => (
                  <Card key={i} className="mb-3">
                    <View className="flex-row items-start gap-2">
                      <Badge
                        label={ins.severity ?? 'info'}
                        variant={ins.severity === 'warning' ? 'warning' : ins.severity === 'critical' ? 'danger' : 'info'}
                      />
                      <Text className="flex-1 text-sm text-gray-700 mt-0.5">{ins.message}</Text>
                    </View>
                  </Card>
                ))}

                <Text className="text-sm font-semibold text-gray-500 uppercase mb-2 mt-4">
                  {i18n.t('ai.recommendations')}
                </Text>
                {recommendations.data?.recommendations?.map((rec, i) => (
                  <Card key={i} className="mb-3">
                    <Text className="text-sm text-gray-700">{rec.message}</Text>
                  </Card>
                ))}

                <Text className="text-sm font-semibold text-gray-500 uppercase mb-2 mt-4">
                  {i18n.t('ai.anomalies')}
                </Text>
                {anomalies.data?.anomalies?.length ? (
                  anomalies.data.anomalies.map((a, i) => (
                    <Card key={i} className="mb-3">
                      <View className="flex-row items-start gap-2">
                        <Badge label="anomaly" variant="warning" />
                        <Text className="flex-1 text-sm text-gray-700 mt-0.5">{a.message}</Text>
                      </View>
                    </Card>
                  ))
                ) : (
                  <Text className="text-gray-400 text-sm">No anomalies detected</Text>
                )}
                <View className="h-8" />
              </>
            )}
          </ScrollView>
        )}

        {tab === 'digest' && (
          <ScrollView className="flex-1 px-4">
            {digest.isLoading ? (
              <ActivityIndicator className="mt-10" color="#6366f1" />
            ) : (
              <Card className="mt-2">
                <Text className="text-base font-semibold text-gray-900 mb-2">{i18n.t('ai.digest')}</Text>
                <Text className="text-sm text-gray-700 leading-relaxed">
                  {digest.data?.digest ?? 'No digest available yet.'}
                </Text>
              </Card>
            )}
          </ScrollView>
        )}

        {tab === 'chat' && (
          <>
            <ScrollView
              ref={scrollRef}
              className="flex-1 px-4"
              contentContainerStyle={{ paddingVertical: 12 }}
            >
              {!chatHistory.length ? (
                <View className="items-center mt-10">
                  <Text className="text-4xl mb-3">🤖</Text>
                  <Text className="text-gray-500 text-center text-sm">
                    Ask me anything about your child's care, sleep, feeding, or development.
                  </Text>
                </View>
              ) : (
                chatHistory.map((msg, i) => <AiChatBubble key={i} role={msg.role} content={msg.content} />)
              )}
              {chat.isPending ? (
                <View className="self-start bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <ActivityIndicator size="small" color="#6366f1" />
                </View>
              ) : null}
            </ScrollView>

            <View className="flex-row items-end px-4 pb-4 gap-2 bg-white border-t border-gray-100 pt-3">
              <TextInput
                className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-base text-gray-900 max-h-24"
                placeholder={i18n.t('ai.chatPlaceholder')}
                value={inputText}
                onChangeText={setInputText}
                multiline
                onSubmitEditing={sendMessage}
              />
              <TouchableOpacity
                onPress={sendMessage}
                disabled={!inputText.trim() || chat.isPending}
                className={`bg-primary-500 rounded-2xl px-4 py-3 ${!inputText.trim() ? 'opacity-50' : ''}`}
              >
                <Text className="text-white font-semibold">{i18n.t('ai.send')}</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </ProGate>
  );
}
