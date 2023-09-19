import { useNavigation } from '@react-navigation/native';
import { VStack, Image, Center, Text, Heading, ScrollView, useToast } from "native-base";

import { Controller, useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import BackgroundImg from '@assets/background.png';
import LogoSvg from '@assets/logo.svg';
import { Input } from "@components/Input";
import { Button } from "@components/Button";

import { AuthNavigatorRoutesProps } from '@routes/auth.routes';
import { useAuht } from '@hooks/useAuth';
import { AppError } from '@utils/AppError';
import { useState } from 'react';

type FormDataProps = {
    email: string;
    password: string;
}

const signInSchema = yup.object({
    email: yup.string().required('Informe o E-mail').email('E-mail inválido!'),
    password: yup.string().required('Informe a senha').min(6, 'Senha deve ter pelo menos 6 dígitos!')
})

export function SignIn() {
    const [isLoading, setIsLoading] = useState(false);

    const toast = useToast();

    const { signIn } = useAuht();

    const { control, handleSubmit, formState: { errors } } = useForm<FormDataProps>({
        resolver: yupResolver(signInSchema)
    });

    const navigation = useNavigation<AuthNavigatorRoutesProps>();

    function handleGoToSignUp() {
        navigation.navigate('signUp');
    }

    async function handleSignIn({ email, password }: FormDataProps) {
        try {
            setIsLoading(true);
            await signIn(email, password);

        } catch (error) {
            const isAppError = error instanceof AppError;
            const title = isAppError ? error.message : 'Não foi possível fazer login. Tente novamente mais tarde.';

            setIsLoading(false);

            toast.show({
                title,
                placement: 'top',
                bgColor: 'red.500'
            })
        }
    }

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <VStack flex={1} px={10} pb={16}>
                <Image
                    source={BackgroundImg}
                    defaultSource={BackgroundImg}
                    alt="Pessoas Treinando na Bike"
                    resizeMode="contain"
                    position="absolute"
                />

                <Center my={24}>
                    <LogoSvg />
                    <Text color="gray.100" fontSize="sm">
                        Treine sua mente e o seu corpo
                    </Text>
                </Center>
                <Center mt={24}>
                    <Heading color="gray.100" fontSize="xl" mb={6} fontFamily="heading">
                        Acesse sua conta
                    </Heading>
                    <Controller
                        control={control}
                        name="email"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                placeholder="E-mail"
                                keyboardType="email-address"
                                autoCapitalize="none"
                                onChangeText={onChange}
                                value={value}
                                errorMessage={errors.email?.message}
                            />
                        )}
                    />

                    <Controller
                        control={control}
                        name="password"
                        render={({ field: { onChange, value } }) => (
                            <Input
                                placeholder="Senha"
                                secureTextEntry
                                onChangeText={onChange}
                                value={value}
                                errorMessage={errors.password?.message}
                            />
                        )}
                    />

                    <Button
                        title="Acessar"
                        onPress={handleSubmit(handleSignIn)}
                        isLoading={isLoading}
                    />

                </Center>
                <Center mt={24}>
                    <Text
                        color="gray.100"
                        fontSize="sm"
                        mb={3}
                        fontFamily="body"
                    >
                        Ainda não tem acesso?
                    </Text>
                    <Button
                        title="Criar conta"
                        variant="outline"
                        onPress={handleGoToSignUp}
                    />
                </Center>
            </VStack>
        </ScrollView>
    );
}