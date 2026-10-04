import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Currency, Rate, fetchRate, formatINR, parseAmount, validateRate } from './src/currency';

const currencies: Currency[] = ['USD', 'EUR'];
const details = { USD: { symbol: '$', flag: '🇺🇸', name: 'US Dollar' }, EUR: { symbol: '€', flag: '🇪🇺', name: 'Euro' } };
const cacheKey = 'currency-converter-rates-v1';

export default function App() {
  const [currency, setCurrency] = useState<Currency>('USD');
  const [amount, setAmount] = useState('100');
  const [rates, setRates] = useState<Partial<Record<Currency, Rate>>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cached, setCached] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const mounted = useRef(true);
  const sequence = useRef(0);

  async function refresh() {
    const request = ++sequence.current;
    controller.current?.abort();
    const abort = new AbortController();
    controller.current = abort;
    setLoading(true);
    setError('');
    const timeout = setTimeout(() => abort.abort(), 12000);
    try {
      const [usd, eur] = await Promise.all(currencies.map((base) => fetchRate(base, abort.signal)));
      if (!mounted.current || request !== sequence.current) return;
      const next = { USD: usd, EUR: eur };
      setRates(next);
      setCached(false);
      await AsyncStorage.setItem(cacheKey, JSON.stringify(next)).catch(() => {});
    } catch {
      if (mounted.current && request === sequence.current) {
        setError('Could not refresh rates. Check your connection and try again.');
        setCached(true);
      }
    } finally {
      clearTimeout(timeout);
      if (mounted.current && request === sequence.current) setLoading(false);
    }
  }

  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(cacheKey);
        if (stored && mounted.current) {
          const data = JSON.parse(stored);
          setRates({ USD: validateRate([data.USD], 'USD'), EUR: validateRate([data.EUR], 'EUR') });
          setCached(true);
        }
      } catch { /* Ignore invalid or inaccessible cache; fetch fresh rates. */ }
      if (mounted.current) void refresh();
    })();
    return () => { mounted.current = false; controller.current?.abort(); };
  }, []);

  const rate = rates[currency];
  const number = parseAmount(amount);
  const invalid = number === null;
  const result = rate && number !== null ? formatINR(number * rate.rate) : '₹ —';
  const date = rate ? new Date(`${rate.date}T12:00:00Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';

  return (
    <SafeAreaProvider>
      <SafeAreaView style={s.safe}>
        <StatusBar style="light" />
        <KeyboardAvoidingView style={s.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={s.page} keyboardShouldPersistTaps="handled">
            <View style={s.header}>
              <View style={s.brandIcon}><Text style={s.brandGlyph}>₹</Text></View>
              <View style={s.flex}><Text style={s.brand}>Currency Converter</Text><Text style={s.brandSub}>A little clarity. Every conversion.</Text></View>
              <View style={s.inrBadge}><Text style={s.inrText}>INR</Text></View>
            </View>
            <Text style={s.eyebrow}>GLOBAL MONEY, LOCAL VALUE</Text>
            <Text style={s.title}>Make sense{ '\n' }of your money<Text style={s.mint}>.</Text></Text>
            <Text style={s.subtitle}>Dollars or euros. See what they're worth in rupees, in an instant.</Text>

            <View style={s.card}>
              <View style={s.cardHeading}><Text style={s.section}>CONVERT TO RUPEES</Text><Text style={s.small}>USD / EUR → INR</Text></View>
              <View style={s.tabs}>
                {currencies.map((code) => <Pressable key={code} accessibilityRole="tab" accessibilityState={{ selected: currency === code }} accessibilityLabel={`Convert ${details[code].name} to Indian rupees`} onPress={() => setCurrency(code)} style={[s.tab, currency === code && s.selectedTab]}><Text style={s.flag}>{details[code].flag}</Text><Text style={[s.tabText, currency === code && s.selectedText]}>{code}</Text><Text style={[s.tabName, currency === code && s.selectedText]}>{details[code].name}</Text></Pressable>)}
              </View>
              <Text style={s.label}>You enter</Text>
              <View style={[s.inputRow, invalid && s.invalid]}>
                <Text style={s.inputSymbol}>{details[currency].symbol}</Text>
                <TextInput accessibilityLabel={`Amount in ${currency}`} value={amount} onChangeText={setAmount} keyboardType="decimal-pad" maxLength={14} placeholder="0.00" placeholderTextColor="#87939b" style={s.input} selectTextOnFocus />
                <Text style={s.inputCode}>{currency}</Text>
              </View>
              {invalid && <Text accessibilityRole="alert" style={s.validation}>Enter a positive amount or zero, with up to 2 decimal places (max 1 billion).</Text>}
              <View style={s.quickRow}>{['100', '500', '1000'].map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Set amount to ${value} ${currency}`} onPress={() => setAmount(value)} style={[s.quick, amount === value && s.quickActive]}><Text style={s.quickText}>{details[currency].symbol}{Number(value).toLocaleString('en-IN')}</Text></Pressable>)}</View>
              <View style={s.divider}><View style={s.line}/><View style={s.arrowCircle}><Text style={s.arrow}>↓</Text></View><View style={s.line}/></View>
              <View style={s.resultCard}>
                <View style={s.resultTop}><Text style={s.receive}>IN INDIAN RUPEES</Text><Text style={s.flag}>🇮🇳</Text></View>
                <Text style={s.result} adjustsFontSizeToFit numberOfLines={1} accessibilityLiveRegion="polite">{result}</Text>
                <Text style={s.resultSub}>Indian Rupee · INR</Text>
                <View style={s.ratePill}><View style={s.dot}/><Text style={s.rateText}>{rate ? `1 ${currency} = ${formatINR(rate.rate)}` : 'Waiting for exchange rate'}</Text></View>
              </View>
              <View style={s.refreshRow}>
                <View style={s.flex}><Text style={s.rateStatus}>{loading ? 'Refreshing rates…' : cached && rate ? 'Saved rate · refresh unavailable' : rate ? 'Daily reference rate' : 'Rate unavailable'}</Text>{rate && <Text style={s.date}>Rate date: {date}</Text>}</View>
                <Pressable accessibilityRole="button" accessibilityLabel="Refresh exchange rates" accessibilityState={{ disabled: loading }} disabled={loading} onPress={() => void refresh()} style={s.refresh}>{loading ? <ActivityIndicator color="#1b5750" size="small"/> : <Text style={s.refreshText}>↻ Refresh</Text>}</Pressable>
              </View>
              {!!error && <Text accessibilityRole="alert" style={s.error}>{error}{rate ? ' Showing the last saved reference rate.' : ' Tap Refresh to retry.'}</Text>}
            </View>

            <View style={s.marketHeading}><Text style={s.marketTitle}>At a glance</Text><Text style={s.marketCaption}>1 unit → INR</Text></View>
            <View style={s.marketRow}>{currencies.map((code) => <Pressable key={code} accessibilityRole="button" accessibilityLabel={`Select ${code}, rate ${rates[code] ? formatINR(rates[code]!.rate) : 'unavailable'}`} onPress={() => setCurrency(code)} style={s.marketCard}><Text style={s.marketCurrency}>{details[code].flag}  {code}</Text><Text style={s.marketValue}>{rates[code] ? formatINR(rates[code]!.rate) : '₹ —'}</Text><Text style={s.marketName}>{details[code].name}</Text></Pressable>)}</View>
            <View style={s.note}><Text style={s.noteIcon}>ⓘ</Text><Text style={s.noteText}>Rates from Frankfurter, updated daily. These are reference estimates; bank rates and fees may differ.</Text></View>
            <Text style={s.footer}>LESS GUESSWORK. MORE CLARITY.</Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  flex:{flex:1}, safe:{flex:1,backgroundColor:'#101f2d'}, page:{padding:24,paddingTop:20,paddingBottom:32,width:'100%',maxWidth:580,alignSelf:'center'},
  header:{flexDirection:'row',alignItems:'center',gap:12,marginBottom:40},brandIcon:{height:42,width:42,backgroundColor:'#b5f4d9',borderRadius:14,alignItems:'center',justifyContent:'center'},brandGlyph:{fontSize:26,fontWeight:'700',color:'#153d34'},brand:{color:'#f3f8fa',fontWeight:'700',fontSize:16},brandSub:{color:'#91a6b7',fontSize:11,marginTop:4},inrBadge:{borderWidth:1,borderColor:'#385060',paddingHorizontal:10,paddingVertical:6,borderRadius:8},inrText:{fontSize:11,color:'#c1d1dd',fontWeight:'700'},
  eyebrow:{fontSize:10,letterSpacing:2,color:'#a6e6ce',fontWeight:'700'},title:{fontSize:42,lineHeight:47,fontWeight:'700',letterSpacing:-1.6,color:'#f8fbfc',marginTop:12},mint:{color:'#b5f4d9'},subtitle:{color:'#a7b7c4',fontSize:14,lineHeight:22,marginTop:12,marginBottom:28,maxWidth:350},
  card:{backgroundColor:'#fff',borderRadius:26,padding:22},cardHeading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:8,flexWrap:'wrap',marginBottom:20},section:{fontSize:10,letterSpacing:1.4,fontWeight:'700',color:'#344754'},small:{color:'#809098',fontSize:10},tabs:{flexDirection:'row',gap:8,marginBottom:24},tab:{flex:1,flexDirection:'row',alignItems:'center',justifyContent:'center',gap:6,paddingVertical:13,borderRadius:12,backgroundColor:'#f0f3f4'},selectedTab:{backgroundColor:'#173e37'},flag:{fontSize:19},tabText:{color:'#293f4a',fontWeight:'700',fontSize:13},tabName:{color:'#647880',fontSize:10},selectedText:{color:'#fff'},label:{color:'#667980',fontSize:12,marginBottom:9},inputRow:{flexDirection:'row',alignItems:'center',backgroundColor:'#f5f7f7',borderWidth:1,borderColor:'#e5eaec',borderRadius:14,paddingHorizontal:16,paddingVertical:12,gap:9},inputSymbol:{fontSize:25,color:'#71858b'},input:{flex:1,fontSize:30,fontWeight:'600',color:'#172f39',padding:0,minWidth:0},inputCode:{fontSize:12,fontWeight:'700',color:'#70828a'},invalid:{borderColor:'#b64444'},validation:{fontSize:11,color:'#ac3939',lineHeight:17,marginTop:7},quickRow:{flexDirection:'row',gap:8,marginTop:12},quick:{paddingHorizontal:16,paddingVertical:8,backgroundColor:'#f4f6f6',borderRadius:8},quickActive:{backgroundColor:'#e0f3eb'},quickText:{fontSize:11,color:'#3d655a',fontWeight:'600'},divider:{flexDirection:'row',alignItems:'center',gap:12,marginVertical:18},line:{height:1,backgroundColor:'#e8eeee',flex:1},arrowCircle:{height:30,width:30,borderRadius:15,backgroundColor:'#f0f5f3',alignItems:'center',justifyContent:'center'},arrow:{fontSize:20,color:'#557b6e'},
  resultCard:{backgroundColor:'#d9f6e9',padding:20,borderRadius:18},resultTop:{flexDirection:'row',alignItems:'center',justifyContent:'space-between'},receive:{fontSize:10,fontWeight:'700',letterSpacing:1.5,color:'#527b69'},result:{fontSize:38,fontWeight:'700',letterSpacing:-1.2,color:'#163e30',marginTop:12},resultSub:{fontSize:12,color:'#56806e',marginTop:4},ratePill:{alignSelf:'flex-start',flexDirection:'row',alignItems:'center',gap:6,marginTop:18,backgroundColor:'#edfdf5',paddingHorizontal:10,paddingVertical:7,borderRadius:8},dot:{height:5,width:5,borderRadius:3,backgroundColor:'#347f5a'},rateText:{fontSize:10,color:'#356650',fontWeight:'600'},refreshRow:{flexDirection:'row',alignItems:'center',gap:10,marginTop:18},rateStatus:{fontSize:10,color:'#5d7379',fontWeight:'600'},date:{fontSize:10,color:'#819398',marginTop:4},refresh:{backgroundColor:'#f0f5f3',paddingHorizontal:12,paddingVertical:9,borderRadius:9,minWidth:82,alignItems:'center'},refreshText:{fontSize:11,fontWeight:'700',color:'#285b4e'},error:{fontSize:11,color:'#a3422c',lineHeight:17,marginTop:12},marketHeading:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:28,marginBottom:13},marketTitle:{color:'#eaf2f5',fontSize:16,fontWeight:'600'},marketCaption:{color:'#91a7b4',fontSize:10},marketRow:{flexDirection:'row',gap:12},marketCard:{flex:1,backgroundColor:'#1b2e3d',borderWidth:1,borderColor:'#2c4252',padding:18,borderRadius:16},marketCurrency:{color:'#b9ccd7',fontSize:12,fontWeight:'600'},marketValue:{color:'#eef7f6',fontSize:23,fontWeight:'700',marginTop:13},marketName:{color:'#8ca5b5',fontSize:10,marginTop:5},note:{flexDirection:'row',gap:9,marginTop:22,paddingHorizontal:5},noteIcon:{color:'#85a5b3',fontSize:16},noteText:{flex:1,color:'#91a9b9',fontSize:11,lineHeight:18},footer:{color:'#638092',fontSize:9,letterSpacing:2,textAlign:'center',marginTop:28},
});
