import { Button, Panel, Txt, V } from '@/_ui';
import CoinTickerCard from '@/_ui/card/CoinTickerCard';
import { getCoins, getOrder, getTicker, postOrder } from '@/apis/client/bithumb';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';

const TickerPanel = () => {
    const [realtime, setRealtime] = useState(false);
    const [lowTradeShow, setLowTradeShow] = useState(false);
    const [coins, setCoins] = useState<any[]>([]);
    const [tickers, setTickers] = useState<any[]>([]);

    const {} = useQuery({
        queryKey: ['coins'],
        queryFn: async () => {
            const coins = await getCoins({});
            setCoins(coins);
        },
    });

    const { refetch } = useQuery({
        queryKey: ['ticker'],
        queryFn: async () => {
            const tickers = await getTicker({ markets: coins.map((coin) => coin.market).join(',') });

            const mergedList = Object.values(
                [...coins, ...tickers].reduce((acc, item) => {
                    acc[item.market] = { ...acc[item.market], ...item };
                    return acc;
                }, {})
            );

            mergedList.sort((a: any, b: any) => b.signed_change_rate - a.signed_change_rate);

            setTickers(lowTradeShow ? mergedList : mergedList.filter((el: any) => el.acc_trade_price_24h > 1000000000));
        },
        enabled: coins.length > 0 && realtime,
        refetchInterval: 100,
    });

    const mutation = useMutation({
        mutationFn: async ({ market }: { market: string }) => {
            const data = await getOrder({ market });

            const bidOkAsset = data?.bid_account?.balance;
            const bidFee = data?.bid_fee;

            await postOrder({
                market,
                side: 'bid',
                price: `${Math.floor(bidOkAsset) - Math.ceil(bidOkAsset * bidFee) - 1}`,
                ord_type: 'price',
            });
        },
        onSuccess: () => {
            alert('매수 완료');
        },
        onError: (data) => {
            alert(JSON.stringify(data, null, 2));
        },
    });

    return (
        <Panel title='현재가 정보' css={{ maxWidth: '600px' }}>
            <V.Row css={{ gap: '10px', justifyContent: 'space-between', alignItems: 'center' }}>
                <Txt>코인 개수: {tickers.length}</Txt>
                <V.Row css={{ gap: '10px' }}>
                    <Button onClick={() => setLowTradeShow((s) => !s)} css={{ width: 'auto' }}>
                        {lowTradeShow ? '1000백만 미만 숨기기' : '1000백만 미만 보이기'}
                    </Button>
                    <Button onClick={() => setRealtime((s) => !s)} css={{ width: 'auto' }}>
                        {realtime ? '실시간 중지' : '실시간 시작'}
                    </Button>
                </V.Row>
            </V.Row>
            <V.Column css={{ gap: '10px' }}>
                {tickers.map((el, key) => (
                    <V.Row css={{ alignItems: 'center', gap: '10px' }}>
                        <CoinTickerCard key={key} {...el} />

                        <Button onClick={() => mutation.mutate({ market: el.market })} css={{ width: 'auto' }}>
                            전액 매수
                        </Button>
                    </V.Row>
                ))}
            </V.Column>
        </Panel>
    );
};

export default TickerPanel;
