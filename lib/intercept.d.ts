export default function intercept(value: object, key: string, interceptCallback: (key: string, method: string, ...args: any) => void): object;
