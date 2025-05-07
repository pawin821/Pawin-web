import { SignUp } from "@clerk/nextjs";
import {PawPrint} from "lucide-react"
export default function Page() {
  
  return(
    <section class="bg-white">
  <div class="lg:grid lg:min-h-screen lg:grid-cols-12">
    <section class="relative flex h-32 items-end bg-gray-900 lg:col-span-5 lg:h-full xl:col-span-6">
      <img
        alt=""
        src="/golden.png"
        class="absolute inset-0 h-full w-full object-cover opacity-80"
      />

      <div class="hidden lg:relative lg:block lg:p-12">


        <h2 class="mt-6 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
           Welcome to Pawin
        </h2>

        <p class="mt-4 leading-relaxed text-white/90">
           Create account for free
        </p>
      </div>
    </section>

    <main
      class="flex items-center justify-center px-8 py-8 sm:px-12 lg:col-span-7 lg:px-16 lg:py-12 xl:col-span-6"
    >
      <div class="max-w-xl lg:max-w-3xl">
        <div class="relative -mt-16 block lg:hidden">


          <h1 class="mt-2 text-2xl font-bold text-white sm:text-3xl md:text-4xl">
                         Welcome to Pawin

          </h1>

          <p class="mt-4 leading-relaxed text-gray-500">
                        Create account for free

          </p>
        </div>
<SignUp />;
     
      </div>
    </main>
  </div>
</section>
  ) 
}//