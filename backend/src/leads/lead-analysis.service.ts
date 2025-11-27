import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import OpenAI from 'openai';

@Injectable()
export class LeadAnalysisService {
  private readonly logger = new Logger(LeadAnalysisService.name);
  private openai: OpenAI | null = null;

  constructor(private prisma: PrismaService) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (apiKey && apiKey !== 'sk-xxxxx' && apiKey.length > 20) {
      this.openai = new OpenAI({ apiKey });
      this.logger.log('✅ OpenAI initialized for lead analysis (GPT-4o-mini)');
      this.logger.log('🧠 AI will classify leads, score them, and generate personalized messages');
    } else {
      this.logger.warn('⚠️ OPENAI_API_KEY not set or invalid, using mock classification');
      this.logger.warn('⚠️ To enable AI features, set OPENAI_API_KEY in .env file');
    }
  }

  /**
   * Analyse un Lead pour déterminer sa qualification et suggérer un message
   * Appelé par un Cron Job ou une Queue
   */
  async analyzePendingLeads(workspaceId: string) {
    // Récupérer les leads "new" qui n'ont pas encore été analysés (pas de leadType)
    const leads = await this.prisma.lead.findMany({
      where: {
        workspaceId,
        status: 'new',
        leadType: null, // Pas encore classifié
        // On prend ceux qui ont au moins une interaction
        lastInteractionAt: { not: null },
      },
      take: 10, // Traitement par lots
      include: {
        target: {
            include: {
                interactions: {
                    take: 5, // Prendre les 5 dernières interactions pour le contexte
                    orderBy: { createdAt: 'desc' }
                }
            }
        }
      }
    });

    if (leads.length > 0) {
      this.logger.log(`\n${'='.repeat(80)}`);
      this.logger.log(`🤖 [FlowIA] Démarrage de l'analyse IA de ${leads.length} leads...`);
      this.logger.log(`${'='.repeat(80)}\n`);
    }

    for (const lead of leads) {
      await this.analyzeLead(lead);
    }
    
    if (leads.length > 0) {
      this.logger.log(`\n${'='.repeat(80)}`);
      this.logger.log(`✅ [FlowIA] Analyse terminée : ${leads.length} leads analysés par l'IA`);
      this.logger.log(`${'='.repeat(80)}\n`);
    }
  }

  private async analyzeLead(lead: any) {
    try {
      // Appel OpenAI réel ou mock selon disponibilité
      const classification = this.openai
        ? await this.realAIClassification(lead)
        : this.mockAIClassification(lead);
      
      // 1. Mettre à jour la classification du Lead
      await this.prisma.lead.update({
        where: { id: lead.id },
        data: {
          leadType: classification.type,
          interestScore: classification.score, // Score affiné par l'IA
          notes: classification.reasoning,
        }
      });

      // 2. Créer une suggestion de message
      if (classification.score > 50) { // Uniquement si le lead est intéressant
        await this.prisma.suggestedMessage.create({
          data: {
            workspaceId: lead.workspaceId,
            leadId: lead.id,
            content: classification.suggestedMessage,
            status: 'pending',
          }
        });
        this.logger.log(`✨ [FlowIA] Message généré pour @${lead.username} (${classification.type}, score: ${classification.score})`);
        this.logger.log(`   💬 Message: "${classification.suggestedMessage}"`);
      } else {
        this.logger.log(`⚠️ [FlowIA] Lead @${lead.username} ignoré (score trop bas: ${classification.score}/100)`);
      }

    } catch (error) {
      this.logger.error(`❌ [FlowIA] Erreur lors de l'analyse du lead ${lead.id}:`, error);
    }
  }

  /**
   * Classification réelle via OpenAI
   */
  private async realAIClassification(lead: any): Promise<{
    type: string;
    score: number;
    reasoning: string;
    suggestedMessage: string;
  }> {
    if (!this.openai) {
      return this.mockAIClassification(lead);
    }

    const interactions = lead.target?.interactions || [];
    const interactionsSummary = interactions
      .slice(0, 10)
      .map((i: any) => `- ${i.type}: ${i.message || 'sans message'}`)
      .join('\n');

    const prompt = `Tu es un expert en qualification de leads pour FlowIA, un SaaS de gestion de leads sur les réseaux sociaux.

🎯 TÂCHE : Analyser ce lead TikTok et le qualifier intelligemment.

📊 CONTEXTE :
- Username : @${lead.username}
- Score d'intérêt actuel : ${lead.interestScore || 0}/100
- Interactions récentes :
${interactionsSummary || 'Aucune interaction récente'}

🏷️ CATÉGORIES POSSIBLES :
- "artist" : Artiste, musicien, créateur de contenu (profil créatif, vidéos musicales)
- "beatmaker" : Producteur musical, beatmaker (profil production, beats)
- "client_potentiel" : Client potentiel intéressé par les services (questions, demandes)
- "fan_engaged" : Fan très engagé (commentaires fréquents, partages)
- "passive_observer" : Observateur passif (juste likes/follows)
- "other" : Autre (ne correspond à aucune catégorie)

📝 ANALYSE À FAIRE :
1. Analyser les interactions pour comprendre le profil
2. Déterminer le niveau d'engagement réel
3. Identifier les signaux d'intérêt (commentaires, questions, partages)
4. Calculer un score d'intérêt précis (0-100)
5. Générer un message personnalisé et engageant

💬 LE MESSAGE DOIT :
- Être naturel et conversationnel
- Mentionner quelque chose de spécifique à ce lead
- Être court (max 200 caractères)
- Inviter à la conversation
- En français

Réponds UNIQUEMENT avec un JSON valide au format suivant :
{
  "type": "catégorie",
  "score": nombre entre 0 et 100,
  "reasoning": "explication courte en français de pourquoi cette classification",
  "suggestedMessage": "message personnalisé court et engageant en français (max 200 caractères)"
}`;

    // 🧠 AFFICHER CE QUE L'IA VA ANALYSER
    this.logger.log(`\n${'='.repeat(80)}`);
    this.logger.log(`🧠 [IA THINKING] Analyse du lead @${lead.username}`);
    this.logger.log(`${'='.repeat(80)}`);
    this.logger.log(`📊 [IA THINKING] Contexte envoyé à l'IA :`);
    this.logger.log(`   - Username: @${lead.username}`);
    this.logger.log(`   - Score actuel: ${lead.interestScore || 0}/100`);
    this.logger.log(`   - Interactions: ${interactions.length} trouvées`);
    if (interactionsSummary) {
      this.logger.log(`   - Détails des interactions:`);
      interactionsSummary.split('\n').forEach(line => {
        if (line.trim()) this.logger.log(`     ${line}`);
      });
    }
    this.logger.log(`\n💭 [IA THINKING] Envoi du prompt à GPT-4o-mini...`);

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'Tu es un expert en qualification de leads pour les réseaux sociaux. Tu analyses les profils TikTok pour identifier les meilleurs prospects. Réponds UNIQUEMENT avec du JSON valide, sans markdown, sans code blocks.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.8, // Un peu plus créatif pour les messages
        max_tokens: 600, // Plus d'espace pour des messages plus personnalisés
      });

      const response = completion.choices[0]?.message?.content || '{}';
      
      // 🧠 AFFICHER LA RÉPONSE BRUTE DE L'IA
      this.logger.log(`\n📥 [IA THINKING] Réponse brute de l'IA (GPT-4o-mini) :`);
      this.logger.log(`   ${response.substring(0, 500)}${response.length > 500 ? '...' : ''}`);
      
      // Nettoyer la réponse (enlever markdown si présent)
      let cleanedResponse = response.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.replace(/```json\n?/g, '').replace(/```\n?/g, '');
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.replace(/```\n?/g, '');
      }
      
      const parsed = JSON.parse(cleanedResponse);
      
      // 🧠 AFFICHER LE RAISONNEMENT DE L'IA
      this.logger.log(`\n🎯 [IA THINKING] Décision de l'IA :`);
      this.logger.log(`   ✅ Catégorie choisie: "${parsed.type}"`);
      this.logger.log(`   📊 Score calculé: ${parsed.score}/100`);
      this.logger.log(`   💭 Raisonnement: ${parsed.reasoning || 'Aucun raisonnement fourni'}`);
      this.logger.log(`   💬 Message généré: "${parsed.suggestedMessage || 'Aucun message'}"`);
      this.logger.log(`${'='.repeat(80)}\n`);

      return {
        type: parsed.type || 'other',
        score: Math.min(100, Math.max(0, parsed.score || 50)),
        reasoning: parsed.reasoning || 'Analyse effectuée par IA',
        suggestedMessage: parsed.suggestedMessage || `Salut @${lead.username} ! Merci pour ton intérêt.`,
      };
    } catch (error) {
      this.logger.error(`Error calling OpenAI for lead ${lead.id}:`, error);
      return this.mockAIClassification(lead);
    }
  }

  // Mock pour simuler l'IA en attendant la clé API
  private mockAIClassification(lead: any) {
    const interactions = lead.target?.interactions || [];
    const hasComments = interactions.some((i: any) => i.type === 'comment');
    
    if (hasComments) {
      return {
        type: 'fan_engaged',
        score: 85,
        reasoning: 'A commenté récemment, engagement fort.',
        suggestedMessage: `Salut @${lead.username} ! Merci pour ton commentaire, ça fait plaisir de voir que tu suis le projet. Tu fais quoi dans la vie ?`
      };
    }

    return {
      type: 'passive_observer',
      score: 40,
      reasoning: 'Juste des likes/follows, engagement moyen.',
      suggestedMessage: `Hello @${lead.username}, merci pour le follow ! Hésite pas si tu as des questions sur mon contenu.`
    };
  }
}

